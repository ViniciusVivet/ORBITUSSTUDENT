import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { AvatarType } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'João' })
  @IsString()
  @MinLength(1)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classGroupId?: string;

  @ApiProperty({ enum: ['template', 'emoji', 'photo'], default: 'template' })
  @IsEnum(AvatarType)
  avatarType: AvatarType;

  @ApiProperty({ example: 'warrior-1' })
  @IsString()
  avatarValue: string;
}
