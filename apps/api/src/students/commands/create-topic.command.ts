export class CreateTopicCommand {
  constructor(
    public readonly teacherUserId: string,
    public readonly name: string,
  ) {}
}
