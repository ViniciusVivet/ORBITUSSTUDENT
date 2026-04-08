import { ListStudentsHandler } from './list-students.handler';
import { ListStudentsQuery } from './list-students.query';
import { PrismaService } from '../../prisma/prisma.service';

describe('ListStudentsHandler', () => {
  let handler: ListStudentsHandler;
  let findMany: jest.Mock;
  let count: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    count = jest.fn().mockResolvedValue(0);
    const prisma = {
      student: { findMany, count },
      lesson: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    handler = new ListStudentsHandler(prisma);
  });

  it('usa orderBy displayName asc quando sortBy e name ou indefinido', async () => {
    await handler.execute(
      new ListStudentsQuery('teacher-1', undefined, undefined, undefined, undefined, 10, 0, 'name'),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { displayName: 'asc' } }),
    );
  });

  it('usa orderBy xp desc quando sortBy e xp', async () => {
    await handler.execute(
      new ListStudentsQuery('teacher-1', undefined, undefined, undefined, undefined, 10, 0, 'xp'),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { xp: 'desc' } }),
    );
  });

  it('usa orderBy level desc e xp desc quando sortBy e level', async () => {
    await handler.execute(
      new ListStudentsQuery('teacher-1', undefined, undefined, undefined, undefined, 10, 0, 'level'),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      }),
    );
  });
});
