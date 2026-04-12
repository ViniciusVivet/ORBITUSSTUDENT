import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListClassGroupsQuery } from './list-class-groups.query';

@QueryHandler(ListClassGroupsQuery)
export class ListClassGroupsHandler implements IQueryHandler<ListClassGroupsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListClassGroupsQuery) {
    return this.prisma.classGroup.findMany({
      where: { teacherUserId: query.teacherUserId },
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
