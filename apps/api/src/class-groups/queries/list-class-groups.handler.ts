import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListClassGroupsQuery } from './list-class-groups.query';

@QueryHandler(ListClassGroupsQuery)
export class ListClassGroupsHandler implements IQueryHandler<ListClassGroupsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.classGroup.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
