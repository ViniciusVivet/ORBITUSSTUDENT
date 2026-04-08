import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClassGroupDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  academicPeriod?: string;
}
