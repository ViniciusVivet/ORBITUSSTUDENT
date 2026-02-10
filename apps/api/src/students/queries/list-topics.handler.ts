import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListTopicsQuery } from './list-topics.query';

@QueryHandler(ListTopicsQuery)
export class ListTopicsHandler implements IQueryHandler<ListTopicsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.topic.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, xpWeight: true },
    });
  }
}
