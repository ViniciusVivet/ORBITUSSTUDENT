import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

class SessionAttendanceDto {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  grade?: number;
}

export class CreateClassSessionDto {
  @IsDateString()
  heldAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionAttendanceDto)
  attendances: SessionAttendanceDto[];
}
