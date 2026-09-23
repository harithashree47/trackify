import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

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
  // Uploads the image buffer to Cloudinary and saves the resulting URL
  async updateAvatar(userId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    let avatarUrl = '';
    try {
      const result = await this.cloudinaryService.uploadImage(file);
      avatarUrl = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new BadRequestException(`Failed to upload image to Cloudinary: ${error?.message || 'Unknown error'}`);
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
