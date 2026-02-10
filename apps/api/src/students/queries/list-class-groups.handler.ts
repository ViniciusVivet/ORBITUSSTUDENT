import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListClassGroupsQuery } from './list-class-groups.query';

@QueryHandler(ListClassGroupsQuery)
export class ListClassGroupsHandler implements IQueryHandler<ListClassGroupsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListClassGroupsQuery) {
    const groups = await this.prisma.classGroup.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, course: true },
    });
    return groups;
  }
}
