export class CreateClassGroupCommand {
  constructor(
    public readonly teacherUserId: string,
    public readonly data: { name: string; course?: string; academicPeriod?: string },
  ) {}
}
