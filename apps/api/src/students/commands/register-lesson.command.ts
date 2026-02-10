export class RegisterLessonCommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      topicId: string;
      heldAt: Date;
      durationMinutes: number;
      rating: number;
      notes?: string;
    },
  ) {}
}
