import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import {
  computeReminderInstant,
  toLocalDateStr,
} from '../common/utils/timezone.util';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  /**
   * Runs every minute and sends a single reminder (Web Push notification) for
   * every goal that is:
   *   - created today (in the user's timezone),
   *   - still incomplete,
   *   - past its automatically scheduled free-time reminder time,
   *   - and has not already received a reminder.
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
      where: { completed: false, reminderSent: false },
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            settings: true,
          },
        },
      },
    });

    const dueGoals = goals.filter((goal) => {
      const settings = goal.user.settings;
      if (!settings?.notificationsEnabled) return false;

      const timezone = settings.timezone || 'UTC';

      // Reminder must land on the goal's own day.
      if (
        toLocalDateStr(goal.createdAt, timezone) !==
        toLocalDateStr(now, timezone)
      ) {
        return false;
      }

      const reminderInstant = computeReminderInstant(now, settings);
      if (!reminderInstant) return false;

      return now.getTime() >= reminderInstant.getTime();
    });

    for (const goal of dueGoals) {
      const body = `🔔 You haven't completed '${goal.title}' yet. Don't forget to finish today's goal!`;

      await this.pushService.sendNotification(goal.user.id, {
        title: 'Trackify Reminder',
        body,
        url: '/goals',
        tag: `goal-${goal.id}`,
      });

      // Mark as sent so each goal only ever produces one notification.
      await this.prisma.goal
        .update({
          where: { id: goal.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        })
        .catch((err: any) => {
          this.logger.error(
            `Failed to mark goal ${goal.id} as reminded: ${err?.message || err}`,
          );
        });
    }
  }
}
