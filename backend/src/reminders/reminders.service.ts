import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { toLocalDateStr } from '../common/utils/timezone.util';

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_GOALS_IN_MESSAGE = 3;

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
   * Runs every minute and sends a single grouped reminder (Web Push
   * notification) to each user who has at least one unfinished goal created
   * today (in the user's own timezone) and has not been reminded in the last
   * hour. As soon as every today goal is completed, reminders stop.
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
      // One reminder per user per hour, regardless of how many goals are due.
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

      const firstName =
        userGoals[0].user.name?.trim().split(/\s+/)[0] || 'there';

      const names = userGoals.map((g) => `'${g.title}'`);
      const shown = names.slice(0, MAX_GOALS_IN_MESSAGE);
      const extra = names.length - shown.length;

      const body =
        names.length === 1
          ? `🔔 Hey ${firstName}! You haven't completed ${shown[0]} yet. Don't forget to finish today's goal! 💪`
          : `🔔 Hey ${firstName}! You still have unfinished goals: ${shown.join(
              ', ',
            )}${extra > 0 ? ` +${extra} more` : ''}. Don't forget to finish today's goals! 💪`;

      await this.pushService.sendNotification(userId, {
        title: `Today's Goal Reminder`,
        body,
        url: '/goals',
        tag: 'goal-reminder',
      });

      // Record the reminder time on every due goal so this user is only
      // reminded again after a full hour.
      await this.prisma.goal
        .updateMany({
          where: { id: { in: userGoals.map((g) => g.id) } },
          data: { reminderSent: true, reminderSentAt: new Date() },
        })
        .catch((err: any) => {
          this.logger.error(
            `Failed to mark ${userGoals.length} goal(s) as reminded: ${err?.message || err}`,
          );
        });
    }
  }
}
