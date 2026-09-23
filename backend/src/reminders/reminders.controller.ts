import { Controller, Post, Headers, UnauthorizedException, HttpCode } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('api/cron')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('trigger-notifications')
  @HttpCode(200)
  async triggerNotifications(@Headers('x-cron-secret') secret: string) {
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      throw new UnauthorizedException('CRON_SECRET is not configured on the server');
    }

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    return this.remindersService.triggerReminders();
  }
}
