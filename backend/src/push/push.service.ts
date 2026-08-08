import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { sendNotification, setVapidDetails } from 'web-push';

export interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');

    this.enabled = Boolean(publicKey && privateKey && subject);

    if (this.enabled) {
      setVapidDetails(subject, publicKey, privateKey);
    } else {
      this.logger.warn(
        'Web Push is disabled: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY or VAPID_SUBJECT is missing.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVapidPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') || '';
  }

  // ========== SUBSCRIBE ==========
  async subscribe(userId: number, dto: SubscribeDto) {
    if (!dto?.endpoint || !dto.keys?.p256dh || !dto.keys?.auth) {
      throw new BadRequestException('Invalid push subscription payload');
    }

    const subscription = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
    });

    await this.prisma.userSettings.upsert({
      where: { userId },
      update: { notificationsEnabled: true },
      create: { userId, notificationsEnabled: true },
    });

    return { success: true, subscription };
  }

  // ========== UNSUBSCRIBE ==========
  async unsubscribe(userId: number, endpoint?: string) {
    if (endpoint) {
      await this.prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
    } else {
      await this.prisma.pushSubscription.deleteMany({ where: { userId } });
    }

    const remaining = await this.prisma.pushSubscription.count({
      where: { userId },
    });

    if (remaining === 0) {
      await this.prisma.userSettings.upsert({
        where: { userId },
        update: { notificationsEnabled: false },
        create: { userId, notificationsEnabled: false },
      });
    }

    return { success: true };
  }

  // ========== LIST SUBSCRIPTIONS ==========
  async getSubscriptions(userId: number) {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========== SEND NOTIFICATION ==========
  async sendNotification(
    userId: number,
    payload: PushPayload,
  ): Promise<boolean> {
    if (!this.enabled) return false;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return false;

    const data = JSON.stringify(payload);
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          data,
        );
        sent += 1;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription no longer valid on the push service.
          await this.prisma.pushSubscription
            .delete({ where: { id: subscription.id } })
            .catch(() => undefined);
        } else {
          this.logger.error(
            `Failed to send push notification to ${subscription.endpoint}: ${err?.message || err}`,
          );
        }
      }
    }

    return sent > 0;
  }
}
