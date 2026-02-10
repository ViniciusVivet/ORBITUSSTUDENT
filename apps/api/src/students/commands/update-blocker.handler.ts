import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBlockerCommand } from './update-blocker.command';

@CommandHandler(UpdateBlockerCommand)
export class UpdateBlockerHandler implements ICommandHandler<UpdateBlockerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateBlockerCommand) {
    const blocker = await this.prisma.blocker.findFirst({
      where: {
        id: command.blockerId,
        studentId: command.studentId,
        student: { teacherUserId: command.teacherUserId },
      },
    });
    if (!blocker) throw new NotFoundException('Bloqueio não encontrado');

    const update: { status?: string; resolvedAt?: Date } = {};
    if (command.data.status === 'resolved') {
      update.status = 'resolved';
      update.resolvedAt = new Date();
    } else if (command.data.status === 'active') {
      update.status = 'active';
    }

    return this.prisma.blocker.update({
      where: { id: command.blockerId },
      data: update,
    });
  }
}
