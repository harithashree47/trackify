import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ========== CREATE USER ==========
  async createUser(dto: CreateUserDto, role: UserRole = UserRole.USER) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });
  }

  // ========== FIND USER BY EMAIL (for auth) ==========
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // ========== FIND USER BY ID ==========
  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // ========== UPDATE LAST LOGIN (for auth) ==========
  async updateLastLogin(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  // ========== GET PROFILE ==========
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return { success: true, data: user };
  }
}
