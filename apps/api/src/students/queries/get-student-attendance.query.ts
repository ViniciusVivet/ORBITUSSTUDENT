export class GetStudentAttendanceQuery {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly month: string,
  ) {}
}
