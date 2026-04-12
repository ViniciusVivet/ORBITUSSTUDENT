export class UpdateLessonCommand {
  constructor(
    public readonly studentId: string,
    public readonly lessonId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      notes?: string | null;
      mediaUrl?: string | null;
    },
  ) {}
}
