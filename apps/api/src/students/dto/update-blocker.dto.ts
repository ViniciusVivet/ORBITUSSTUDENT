import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, IsArray, ValidateIf } from 'class-validator';

export class UpdateBlockerDto {
  @ApiPropertyOptional({ enum: ['active', 'resolved'] })
  @IsOptional()
  @IsIn(['active', 'resolved'])
  status?: 'active' | 'resolved';

  @ApiPropertyOptional({ nullable: true, description: 'Observação / nota rápida (null ou vazio remove)' })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  observation?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
