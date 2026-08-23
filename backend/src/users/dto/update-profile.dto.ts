import { IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Haritha Shree' })
  @IsOptional()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(60, { message: 'Name must be at most 60 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'you@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email?: string;
}
