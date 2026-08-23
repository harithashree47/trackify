import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';

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
        avatarUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return { success: true, data: user };
  }

  // ========== UPDATE PROFILE ==========
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // If the email is being changed, make sure it is not taken by someone else.
    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return { success: true, data: updated };
  }

  // ========== UPDATE AVATAR ==========
  // Stores the uploaded profile picture under /uploads/avatars (saved to disk
  // by multer in the controller) and points the user's avatarUrl at it. The
  // previous file is removed so the uploads folder does not grow forever.
  async updateAvatar(userId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const avatarUrl = `/uploads/avatars/${file.filename}`;

    // Best-effort cleanup of the old avatar file.
    if (user.avatarUrl?.startsWith('/uploads/')) {
      try {
        const uploadsRoot = resolve(process.cwd(), 'uploads');
        const oldPath = resolve(process.cwd(), '.' + user.avatarUrl);
        if (oldPath.startsWith(uploadsRoot) && existsSync(oldPath)) {
          unlinkSync(oldPath);
        }
      } catch {
        // A stale file on disk must never block the update.
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return { success: true, data: updated };
  }
}
