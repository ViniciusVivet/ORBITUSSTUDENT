import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({ example: 'Completar módulo HTML' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['pending', 'in_progress', 'completed'] })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  deadlineAt?: string;
}
