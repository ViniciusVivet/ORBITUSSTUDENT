import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddBlockerCommand } from './add-blocker.command';

@CommandHandler(AddBlockerCommand)
export class AddBlockerHandler implements ICommandHandler<AddBlockerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: AddBlockerCommand) {
    const student = await this.prisma.student.findFirst({
      where: { id: command.studentId, teacherUserId: command.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.blocker.create({
      data: {
        studentId: command.studentId,
        teacherUserId: command.teacherUserId,
        titleOrTopic: command.data.titleOrTopic.trim(),
        severity: Math.min(3, Math.max(1, command.data.severity)),
        tags: command.data.tags ?? [],
        observation: command.data.observation?.trim() ?? null,
      },
    });
  }
}
