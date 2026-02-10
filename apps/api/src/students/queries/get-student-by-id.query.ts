export class GetStudentByIdQuery {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
  ) {}
}
