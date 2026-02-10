export class ListStudentsQuery {
  constructor(
    public readonly teacherUserId: string,
    public readonly search?: string,
    public readonly classGroupId?: string,
    public readonly status?: string,
    public readonly noLessonSinceDays?: number,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}
