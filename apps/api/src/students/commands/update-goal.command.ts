import { GoalStatus } from '@prisma/client';

export class UpdateGoalCommand {
  constructor(
    public readonly studentId: string,
    public readonly goalId: string,
    public readonly teacherUserId: string,
    public readonly data: { status?: GoalStatus; completedAt?: Date | null },
  ) {}
}
