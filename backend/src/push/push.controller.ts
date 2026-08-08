import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @ApiOperation({ summary: 'Get the VAPID public key for subscribing' })
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @ApiOperation({
    summary: 'Subscribe current user device to push notifications',
  })
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.pushService.subscribe(Number(req.user.sub), dto);
  }

  @ApiOperation({
    summary: 'Unsubscribe current user device from push notifications',
  })
  @UseGuards(JwtAuthGuard)
  @Delete('unsubscribe')
  unsubscribe(@Req() req: any, @Query('endpoint') endpoint?: string) {
    return this.pushService.unsubscribe(
      Number(req.user.sub),
      endpoint || undefined,
    );
  }

  @ApiOperation({ summary: 'List current user push subscriptions' })
  @UseGuards(JwtAuthGuard)
  @Get('subscriptions')
  getSubscriptions(@Req() req: any) {
    return this.pushService.getSubscriptions(Number(req.user.sub));
  }
}
