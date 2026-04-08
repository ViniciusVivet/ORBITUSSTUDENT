import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class UpsertAttendanceDto {
  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
