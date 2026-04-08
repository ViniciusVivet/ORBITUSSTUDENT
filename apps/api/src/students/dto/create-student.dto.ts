import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, IsArray, IsInt, Min, Max, IsDateString } from 'class-validator';
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

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekDays?: number[];

  @IsOptional()
  @IsDateString()
  courseStartAt?: string | null;

  @IsOptional()
  @IsDateString()
  courseEndAt?: string | null;
}
