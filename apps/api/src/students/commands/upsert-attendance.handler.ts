import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertAttendanceCommand } from './upsert-attendance.command';

@CommandHandler(UpsertAttendanceCommand)
export class UpsertAttendanceHandler implements ICommandHandler<UpsertAttendanceCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpsertAttendanceCommand) {
    const student = await this.prisma.student.findFirst({
      where: { id: command.studentId, teacherUserId: command.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const date = new Date(command.data.date + 'T12:00:00Z');
    const record = await this.prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId: command.studentId, date } },
      create: {
        studentId: command.studentId,
        date,
        status: command.data.status,
        note: command.data.note ?? null,
      },
      update: {
        status: command.data.status,
        note: command.data.note ?? null,
      },
    });

    return { ...record, date: record.date.toISOString().substring(0, 10) };
  }
}
