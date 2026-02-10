export class ListBlockersQuery {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly status?: string,
  ) {}
}
