export class GetStudentSummaryQuery {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
  ) {}
}
