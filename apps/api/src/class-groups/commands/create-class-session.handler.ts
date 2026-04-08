import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSessionCommand } from './create-class-session.command';

@CommandHandler(CreateClassSessionCommand)
export class CreateClassSessionHandler implements ICommandHandler<CreateClassSessionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateClassSessionCommand) {
    const group = await this.prisma.classGroup.findUnique({
      where: { id: command.classGroupId },
    });
    if (!group) throw new NotFoundException('Turma não encontrada');

    const session = await this.prisma.classSession.create({
      data: {
        classGroupId: command.classGroupId,
        teacherUserId: command.teacherUserId,
        heldAt: new Date(command.data.heldAt),
        durationMinutes: command.data.durationMinutes,
        topicId: command.data.topicId ?? null,
        notes: command.data.notes ?? null,
      },
    });

    if (command.data.attendances.length > 0) {
      await this.prisma.sessionAttendance.createMany({
        data: command.data.attendances.map((a) => ({
          sessionId: session.id,
          studentId: a.studentId,
          status: a.status,
          note: a.note ?? null,
          grade: a.grade ?? null,
        })),
      });
    }

    return { ...session, attendanceCount: command.data.attendances.length };
  }
}
