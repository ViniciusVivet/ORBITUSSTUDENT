import { AttendanceStatus } from '@prisma/client';

export class UpsertAttendanceCommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      date: string;
      status: AttendanceStatus;
      note?: string;
    },
  ) {}
}
