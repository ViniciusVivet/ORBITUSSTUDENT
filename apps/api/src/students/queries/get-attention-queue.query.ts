export class GetAttentionQueueQuery {
  constructor(
    public readonly teacherUserId: string,
    public readonly limit: number,
  ) {}
}
