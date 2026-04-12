import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSessionCommand } from './create-class-session.command';

@CommandHandler(CreateClassSessionCommand)
export class CreateClassSessionHandler implements ICommandHandler<CreateClassSessionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateClassSessionCommand) {
    const group = await this.prisma.classGroup.findFirst({
      where: { id: command.classGroupId, teacherUserId: command.teacherUserId },
    });
    if (!group) throw new NotFoundException('Turma nao encontrada');

    const attendanceStudentIds = command.data.attendances.map((attendance) => attendance.studentId);
    if (attendanceStudentIds.length > 0) {
      const validStudents = await this.prisma.student.findMany({
        where: {
          id: { in: attendanceStudentIds },
          teacherUserId: command.teacherUserId,
          classGroupId: command.classGroupId,
        },
        select: { id: true },
      });
      const validIds = new Set(validStudents.map((student) => student.id));
      if (attendanceStudentIds.some((studentId) => !validIds.has(studentId))) {
        throw new NotFoundException('Aluno da chamada nao pertence a esta turma');
      }
    }

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
        data: command.data.attendances.map((attendance) => ({
          sessionId: session.id,
          studentId: attendance.studentId,
          status: attendance.status,
          note: attendance.note ?? null,
          grade: attendance.grade ?? null,
        })),
      });
    }

    return { ...session, attendanceCount: command.data.attendances.length };
  }
}
