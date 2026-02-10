import { StudentStatus } from '@prisma/client';

export class UpdateStudentCommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      displayName?: string;
      fullName?: string | null;
      classGroupId?: string | null;
      status?: StudentStatus;
    },
  ) {}
}
