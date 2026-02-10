export class AddBlockerCommand {
  constructor(
    public readonly studentId: string,
    public readonly teacherUserId: string,
    public readonly data: {
      titleOrTopic: string;
      severity: number;
      tags?: string[];
      observation?: string;
    },
  ) {}
}
