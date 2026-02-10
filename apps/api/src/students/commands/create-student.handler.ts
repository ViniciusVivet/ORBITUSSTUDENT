import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentCommand } from './create-student.command';

@CommandHandler(CreateStudentCommand)
export class CreateStudentHandler implements ICommandHandler<CreateStudentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStudentCommand) {
    const { teacherUserId, data } = command;
    const student = await this.prisma.student.create({
      data: {
        teacherUserId,
        displayName: data.displayName.trim(),
        fullName: data.fullName?.trim() || null,
        classGroupId: data.classGroupId || null,
        avatarType: data.avatarType,
        avatarValue: data.avatarValue,
      },
      include: { classGroup: { select: { id: true, name: true } } },
    });
    return student;
  }
}
