import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetStudentAttendanceQuery } from './get-student-attendance.query';

@QueryHandler(GetStudentAttendanceQuery)
export class GetStudentAttendanceHandler implements IQueryHandler<GetStudentAttendanceQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStudentAttendanceQuery) {
    const student = await this.prisma.student.findFirst({
      where: { id: query.studentId, teacherUserId: query.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const [year, month] = query.month.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: query.studentId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return records.map((r) => ({
      ...r,
      date: r.date.toISOString().substring(0, 10),
    }));
  }
}
