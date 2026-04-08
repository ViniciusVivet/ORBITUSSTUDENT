import { AttendanceStatus } from '@prisma/client';

export class CreateClassSessionCommand {
  constructor(
    public readonly classGroupId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      heldAt: string;
      durationMinutes: number;
      topicId?: string;
      notes?: string;
      attendances: Array<{ studentId: string; status: AttendanceStatus; note?: string; grade?: number }>;
    },
  ) {}
}
