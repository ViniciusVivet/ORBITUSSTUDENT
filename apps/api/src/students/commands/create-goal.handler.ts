import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalCommand } from './create-goal.command';

@CommandHandler(CreateGoalCommand)
export class CreateGoalHandler implements ICommandHandler<CreateGoalCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateGoalCommand) {
    const student = await this.prisma.student.findFirst({
      where: { id: command.studentId, teacherUserId: command.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.goal.create({
      data: {
        studentId: command.studentId,
        teacherUserId: command.teacherUserId,
        title: command.data.title.trim(),
        description: command.data.description?.trim() ?? null,
        status: command.data.status ?? 'pending',
        deadlineAt: command.data.deadlineAt ?? null,
      },
    });
  }
}
