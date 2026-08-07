import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @ApiOperation({ summary: 'Get all goals for current user' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.goalsService.findAll(Number(req.user.sub));
  }

  @ApiOperation({ summary: 'Create a goal' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(Number(req.user.sub), dto);
  }

  @ApiOperation({ summary: 'Update a goal' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.update(Number(req.user.sub), Number(id), dto);
  }

  @ApiOperation({ summary: 'Toggle goal completion' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  toggleComplete(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.toggleComplete(Number(req.user.sub), Number(id));
  }

  @ApiOperation({ summary: 'Delete a goal' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.remove(Number(req.user.sub), Number(id));
  }
}
