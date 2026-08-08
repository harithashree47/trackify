import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import {
  computeReminderInstant,
  toLocalDateStr,
} from '../common/utils/timezone.util';

interface MessageTemplate {
  title: (name: string) => string;
  body: (goalTitle: string) => string;
}

const REMINDER_MESSAGES: MessageTemplate[] = [
  {
    title: (name) => `Hey ${name} 👀`,
    body: (goal) => `"${goal}" is waiting for you. Don't keep it hungry! 🔥`,
  },
  {
    title: (name) => `${name}, quick reminder! ⏰`,
    body: (goal) => `Your "${goal}" goal is still pending. Go smash it!`,
  },
  {
    title: (name) => `Psst ${name} 🤫`,
    body: (goal) => `"${goal}" is still waiting. Today's not over yet!`,
  },
  {
    title: (name) => `${name}, where are you? 👀`,
    body: (goal) => `"${goal}" is still incomplete. Let's finish it!`,
  },
  {
    title: (name) => `Hey ${name}! 🔥`,
    body: (goal) => `Your "${goal}" goal is calling. Time to get it done!`,
  },
  {
    title: (name) => `${name}, one more push! 💪`,
    body: (goal) => `"${goal}" is still pending. You've got this!`,
  },
  {
    title: (name) => `${name} 👋`,
    body: () => `Your goal hasn't checked itself off yet. Go make it happen!`,
  },
  {
    title: (name) => `Don't forget, ${name}! 😊`,
    body: (goal) => `"${goal}" is still on today's list.`,
  },
  {
    title: (name) => `${name}, it's goal time! 🚀`,
    body: (goal) => `Finish "${goal}" and call it a day!`,
  },
  {
    title: (name) => `Hey ${name}, last call! ⏰`,
    body: (goal) => `"${goal}" is still pending. Finish strong!`,
  },
];

const pick = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

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
   *   - and has not been reminded in the last hour.
   * Only ONE notification per user is sent per run (grouped), and the shared
   * tag keeps only one visible at a time.
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

    const ONE_HOUR_MS = 60 * 60 * 1000;

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

      // Only remind again if the last reminder was more than an hour ago.
      if (
        goal.reminderSentAt &&
        now.getTime() - goal.reminderSentAt.getTime() < ONE_HOUR_MS
      ) {
        return false;
      }

      return now.getTime() >= reminderInstant.getTime();
    });

    // Group due goals by user so each user receives a single notification.
    const goalsByUser = new Map<number, typeof dueGoals>();
    for (const goal of dueGoals) {
      const userId = goal.user.id;
      const list = goalsByUser.get(userId) ?? [];
      list.push(goal);
      goalsByUser.set(userId, list);
    }

    for (const [userId, userGoals] of goalsByUser) {
      // Pick one random goal to show in the single notification.
      const randomGoal =
        userGoals[Math.floor(Math.random() * userGoals.length)];

      const firstName =
        randomGoal.user.name?.trim().split(/\s+/)[0] || 'there';
      const template = pick(REMINDER_MESSAGES);

      await this.pushService.sendNotification(userId, {
        title: template.title(firstName),
        body: template.body(randomGoal.title),
        url: '/goals',
        tag: 'goal-reminder',
      });

      // Record the reminder time on every due goal so the next one for this
      // user can only fire again after an hour.
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
