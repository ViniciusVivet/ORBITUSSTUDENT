import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListGoalsQuery } from './list-goals.query';

@QueryHandler(ListGoalsQuery)
export class ListGoalsHandler implements IQueryHandler<ListGoalsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListGoalsQuery) {
    const student = await this.prisma.student.findFirst({
      where: { id: query.studentId, teacherUserId: query.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const where: { studentId: string; status?: string } = { studentId: query.studentId };
    if (query.status) where.status = query.status as 'pending' | 'in_progress' | 'completed';

    return this.prisma.goal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
