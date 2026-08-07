import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  // ========== GET ALL GOALS FOR A USER ==========
  async findAll(userId: number) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========== CREATE GOAL ==========
  async create(userId: number, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority ?? 'medium',
      },
    });
  }

  // ========== UPDATE GOAL ==========
  async update(userId: number, goalId: number, dto: UpdateGoalDto) {
    const goal = await this.findOwnedGoal(userId, goalId);

    return this.prisma.goal.update({
      where: { id: goal.id },
      data: dto,
    });
  }

  // ========== TOGGLE COMPLETION ==========
  async toggleComplete(userId: number, goalId: number) {
    const goal = await this.findOwnedGoal(userId, goalId);

    return this.prisma.goal.update({
      where: { id: goal.id },
      data: { completed: !goal.completed },
    });
  }

  // ========== DELETE GOAL ==========
  async remove(userId: number, goalId: number) {
    const goal = await this.findOwnedGoal(userId, goalId);

    await this.prisma.goal.delete({
      where: { id: goal.id },
    });

    return { success: true, message: 'Goal deleted' };
  }

  // ========== PRIVATE: ensure goal belongs to user ==========
  private async findOwnedGoal(userId: number, goalId: number) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }
}
