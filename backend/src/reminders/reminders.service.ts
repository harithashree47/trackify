import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
      this.handleGoalReminders().catch((err: any) => {
        this.logger.error(
          `Startup reminder pass failed: ${err?.message || err}`,
        );
      });
    }, 15_000);
  }

  /**
   * Runs every minute and sends at most one reminder (Web Push notification)
   * per user per hour. The reminder mentions exactly one pending goal and
   * rotates through the user's pending goals so each one gets a turn. Goals
   * are only considered if created today (in the user's own timezone) and not
   * already reminded within the last hour. As soon as every today goal is
   * completed, reminders stop.
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'goal-reminders' })
  async handleGoalReminders() {
    if (!this.pushService.isEnabled()) return;

    try {
      await this.processDueReminders();
    } catch (err: any) {
      this.logger.error(
        `Reminder cron failed: ${err?.message || err}`,
        err?.stack,
      );
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

      await this.pushService.sendNotification(userId, {
        title: `Today's Goal Reminder`,
        body,
        url: '/goals',
        tag: `goal-reminder-${selected.id}`,
      });

      // Record the reminder time only on the selected goal so the next hour's
      // notification rotates to a different pending goal.
      await this.prisma.goal
        .updateMany({
          where: { id: selected.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        })
        .catch((err: any) => {
          this.logger.error(
            `Failed to mark goal #${selected.id} as reminded: ${err?.message || err}`,
          );
        });
    }
  }
}
