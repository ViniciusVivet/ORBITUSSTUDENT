export class UpdateBlockerCommand {
  constructor(
    public readonly studentId: string,
    public readonly blockerId: string,
    public readonly teacherUserId: string,
    public readonly data: { status?: 'active' | 'resolved' },
  ) {}
}
