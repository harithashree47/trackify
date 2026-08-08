import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get reminder settings for current user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  getSettings(@Req() req: any) {
    return this.settingsService.getSettings(Number(req.user.sub));
  }

  @ApiOperation({ summary: 'Update reminder settings for current user' })
  @UseGuards(JwtAuthGuard)
  @Put()
  updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(Number(req.user.sub), dto);
  }
}
