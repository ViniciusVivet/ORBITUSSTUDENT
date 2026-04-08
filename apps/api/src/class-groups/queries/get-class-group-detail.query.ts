export class GetClassGroupDetailQuery {
  constructor(
    public readonly classGroupId: string,
    public readonly teacherUserId: string,
  ) {}
}
