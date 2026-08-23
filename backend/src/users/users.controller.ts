import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(Number(req.user.sub));
  }

  @ApiOperation({ summary: 'Update current user profile (name / email)' })
  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(Number(req.user.sub), dto);
  }

  @ApiOperation({ summary: "Upload the current user's profile picture" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          // One file per user per upload moment; the service deletes the
          // previous one after a successful update.
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `avatar-${req.user?.sub ?? 'unknown'}-${Date.now()}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Only JPG, PNG, WEBP or GIF images are allowed'
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(Number(req.user.sub), file);
  }
}
