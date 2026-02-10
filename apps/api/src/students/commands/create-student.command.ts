import { AvatarType } from '@prisma/client';

export class CreateStudentCommand {
  constructor(
    public readonly teacherUserId: string,
    public readonly data: {
      displayName: string;
      fullName?: string;
      classGroupId?: string;
      avatarType: AvatarType;
      avatarValue: string;
    },
  ) {}
}
