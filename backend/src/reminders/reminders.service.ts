import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { toLocalDateStr } from '../common/utils/timezone.util';

const ONE_HOUR_MS = 60 * 60 * 1000;

const REMINDER_MESSAGES = [
  `Yo {username}! 😎 Still got one — {goal}`,
  `Psst {username}! 👀 Don’t forget this — {goal}`,
  `Ayy {username}! 🔥 Let’s get this done — {goal}`,
  `Oii {username}! 😄 One more to finish — {goal}`,
  `{username} 👋 This one’s still waiting — {goal}`,
  `{username}, come on! 😤 Just one more — {goal}`,
  `Heyy {username}! 👀 Wanna finish this? — {goal}`,
  `Yo yo {username}! 😂 This one needs you — {goal}`,
  `{username} 😎 One more, let’s go! — {goal}`,
  `Psst! {username} 🤫 Your goal is waiting — {goal}`,
  `Ayy {username}! 🚀 Time to tick this off — {goal}`,
  `{username} 🔥 Let’s knock this one out — {goal}`,
  `Oii {username}! 👀 Still got this one — {goal}`,
  `{username} ✨ Your next little win — {goal}`,
  `Come on {username}! 💪 One more — {goal}`,
];

interface DueGoal {
  id: number;
  title: string;
  createdAt: Date;
  reminderSentAt: Date | null;
  user: {
    id: number;
    name: string | null;
    settings: {
      timezone?: string;
      notificationsEnabled?: boolean;
    } | null;
  };
}

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  /**
   * When the backend process starts (including when a hosted instance wakes up
   * after sleeping), run one reminder pass so any missed reminder window is
   * delivered to users with unfinished goals. The per-user per-hour guard in
   * `processDueReminders` prevents duplicate/spammy notifications.
   */
  async onModuleInit() {
    setTimeout(() => {
      this.triggerReminders().catch((err: any) => {
        this.logger.error(
          `Startup reminder pass failed: ${err?.message || err}`,
        );
      });
    }, 15_000);
  }

  /**
   * Called by the external trigger endpoint to send at most one reminder
   * (Web Push notification) per user per hour.
   */
  async triggerReminders() {
    this.logger.log('External trigger received: Starting reminder processing...');
    if (!this.pushService.isEnabled()) {
      this.logger.warn('Push service is disabled. Aborting reminders.');
      return { success: false, reason: 'Push service disabled' };
    }

    try {
      const stats = await this.processDueReminders();
      this.logger.log(`Finished reminder processing. Sent: ${stats.sent}, Skipped: ${stats.skipped}`);
      return { success: true, stats };
    } catch (err: any) {
      this.logger.error(
        `Reminder processing failed: ${err?.message || err}`,
        err?.stack,
      );
      return { success: false, error: err?.message || err };
    }
  }

  private async processDueReminders() {
    const now = new Date();

    const goals = await this.prisma.goal.findMany({
      where: { completed: false },
      select: {
        id: true,
        title: true,
        createdAt: true,
        reminderSentAt: true,
        user: {
          select: {
            id: true,
            name: true,
            settings: true,
          },
        },
      },
    });

    this.logger.log(`Found ${goals.length} total pending goals across all users.`);

    // Keep only today's (in the user's timezone) unfinished goals.
    const goalsByUser = new Map<number, DueGoal[]>();
    for (const goal of goals) {
      const settings = goal.user.settings;
      if (!settings?.notificationsEnabled) continue;

      const timezone = settings.timezone || 'UTC';
      if (
        toLocalDateStr(goal.createdAt, timezone) !==
        toLocalDateStr(now, timezone)
      ) {
        continue;
      }

      const userId = goal.user.id;
      const list = goalsByUser.get(userId) ?? [];
      list.push(goal);
      goalsByUser.set(userId, list);
    }
    
    this.logger.log(`Found ${goalsByUser.size} users with due goals today.`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const [userId, userGoals] of goalsByUser) {
      // Maximum one pending-goal notification per user per hour.
      const latestReminder = userGoals.reduce<number>(
        (latest, g) =>
          g.reminderSentAt
            ? Math.max(latest, g.reminderSentAt.getTime())
            : latest,
        0,
      );
      if (latestReminder && now.getTime() - latestReminder < ONE_HOUR_MS) {
        this.logger.debug(`Skipping user ${userId}: already reminded within the last hour.`);
        skippedCount++;
        continue;
      }

      // Rotate through the pending goals: pick the one that has not been
      // reminded for the longest (never-reminded goals first, then earliest
      // created) so every pending goal gets its own hourly notification.
      const selected = [...userGoals].sort((a, b) => {
        const aTime = a.reminderSentAt ? a.reminderSentAt.getTime() : 0;
        const bTime = b.reminderSentAt ? b.reminderSentAt.getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })[0];

      const firstName =
        selected.user.name?.trim().split(/\s+/)[0] || 'there';

      const template =
        REMINDER_MESSAGES[
          Math.floor(Math.random() * REMINDER_MESSAGES.length)
        ];

      const body = template
        .replaceAll('{username}', firstName)
        .replaceAll('{goal}', selected.title);

      this.logger.log(`Attempting to send notification to user ${userId} for goal #${selected.id}`);
      
      try {
        await this.pushService.sendNotification(userId, {
          title: `Today's Goal Reminder`,
          body,
          url: '/goals',
          tag: `goal-reminder-${selected.id}`,
        });
        
        sentCount++;
        this.logger.log(`Successfully sent notification to user ${userId}`);

        // Record the reminder time only on the selected goal so the next hour's
        // notification rotates to a different pending goal.
        await this.prisma.goal.updateMany({
          where: { id: selected.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to process notification for user ${userId}, goal #${selected.id}: ${err?.message || err}`,
        );
      }
    }
    
    return { sent: sentCount, skipped: skippedCount };
  }
}
