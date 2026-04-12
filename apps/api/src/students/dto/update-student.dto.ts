import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min, Max, IsDateString, IsUrl } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'archived'] })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  photoUrl?: string | null;

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
