import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
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
}
