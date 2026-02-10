import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsDateString } from 'class-validator';

export class RegisterLessonDto {
  @ApiProperty({ description: 'ID do tópico da aula' })
  @IsString()
  topicId: string;

  @ApiProperty({ example: '2025-02-09T14:00:00.000Z' })
  @IsDateString()
  heldAt: string;

  @ApiProperty({ example: 45, minimum: 1, maximum: 480 })
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
