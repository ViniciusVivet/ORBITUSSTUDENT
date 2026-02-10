import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListBlockersQuery } from './list-blockers.query';

@QueryHandler(ListBlockersQuery)
export class ListBlockersHandler implements IQueryHandler<ListBlockersQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListBlockersQuery) {
    const student = await this.prisma.student.findFirst({
      where: { id: query.studentId, teacherUserId: query.teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const where: { studentId: string; status?: string } = { studentId: query.studentId };
    if (query.status) where.status = query.status as 'active' | 'resolved';

    return this.prisma.blocker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
