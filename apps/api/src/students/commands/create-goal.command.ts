import { GoalStatus } from '@prisma/client';

export class CreateGoalCommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      title: string;
      description?: string;
      status?: GoalStatus;
      deadlineAt?: Date | null;
    },
  ) {}
}
