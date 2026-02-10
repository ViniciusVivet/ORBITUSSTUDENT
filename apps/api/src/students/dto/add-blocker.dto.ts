import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, IsArray } from 'class-validator';

export class AddBlockerDto {
  @ApiProperty({ example: 'Dificuldade com condicionais' })
  @IsString()
  titleOrTopic: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 3 })
  @IsInt()
  @Min(1)
  @Max(3)
  severity: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observation?: string;
}
