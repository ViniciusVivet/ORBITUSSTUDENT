import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGoalCommand } from './update-goal.command';

@CommandHandler(UpdateGoalCommand)
export class UpdateGoalHandler implements ICommandHandler<UpdateGoalCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateGoalCommand) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: command.goalId,
        studentId: command.studentId,
        student: { teacherUserId: command.teacherUserId },
      },
    });
    if (!goal) throw new NotFoundException('Meta não encontrada');

    const data: { status?: typeof goal.status; completedAt?: Date | null } = {};
    if (command.data.status !== undefined) {
      data.status = command.data.status;
      data.completedAt = command.data.status === 'completed' ? new Date() : null;
    }
    if (command.data.completedAt !== undefined) data.completedAt = command.data.completedAt;

    return this.prisma.goal.update({
      where: { id: command.goalId },
      data,
    });
  }
}
