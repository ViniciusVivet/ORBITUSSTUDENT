import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListStudentsQuery } from './list-students.query';

@QueryHandler(ListStudentsQuery)
export class ListStudentsHandler implements IQueryHandler<ListStudentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListStudentsQuery) {
    const { teacherUserId, search, classGroupId, status, noLessonSinceDays, limit = 50, offset = 0 } = query;
    const where: Record<string, unknown> = { teacherUserId };
    if (classGroupId) where.classGroupId = classGroupId;
    if (status) where.status = status;
    if (search?.trim()) {
      where.OR = [
        { displayName: { contains: search.trim(), mode: 'insensitive' } },
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (noLessonSinceDays != null && noLessonSinceDays > 0) {
      const since = new Date();
      since.setDate(since.getDate() - noLessonSinceDays);
      const withRecentLesson = await this.prisma.lesson.findMany({
        where: { heldAt: { gte: since } },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const idsWithLesson = withRecentLesson.map((l) => l.studentId);
      where.id = { notIn: idsWithLesson };
    }
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { classGroup: { select: { id: true, name: true } } },
        orderBy: { displayName: 'asc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.student.count({ where }),
    ]);
    return {
      items: students.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        fullName: s.fullName,
        avatarType: s.avatarType,
        avatarValue: s.avatarValue,
        photoUrl: s.photoUrl,
        level: s.level,
        xp: s.xp,
        status: s.status,
        classGroup: s.classGroup,
      })),
      total,
    };
  }
}
