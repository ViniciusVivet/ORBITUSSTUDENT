import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ListStudentsQuery } from './list-students.query';

/** Ordenacao alinhada ao Roster (nome A-Z, XP e nivel decrescentes). */
function orderByForSort(sortBy?: string) {
  if (sortBy === 'xp') return { xp: 'desc' as const };
  if (sortBy === 'level') return [{ level: 'desc' as const }, { xp: 'desc' as const }];
  return { displayName: 'asc' as const };
}

type AttentionHints = {
  activeBlockersCount: number;
  overdueGoalsCount: number;
  daysSinceLastLesson: number | null;
};

async function buildAttentionHintsMap(
  prisma: PrismaService,
  studentIds: string[],
): Promise<Map<string, AttentionHints>> {
  const map = new Map<string, AttentionHints>();
  if (studentIds.length === 0) return map;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const id of studentIds) {
    map.set(id, { activeBlockersCount: 0, overdueGoalsCount: 0, daysSinceLastLesson: null });
  }

  const [blockerGroups, overdueGroups, lessonMaxes] = await Promise.all([
    prisma.blocker.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds }, status: 'active' },
      _count: { _all: true },
    }),
    prisma.goal.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        status: { not: 'completed' },
        deadlineAt: { not: null, lt: startOfToday },
      },
      _count: { _all: true },
    }),
    prisma.lesson.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds } },
      _max: { heldAt: true },
    }),
  ]);

  for (const g of blockerGroups) {
    const h = map.get(g.studentId);
    if (h) h.activeBlockersCount = g._count._all;
  }
  for (const g of overdueGroups) {
    const h = map.get(g.studentId);
    if (h) h.overdueGoalsCount = g._count._all;
  }
  const now = new Date();
  for (const g of lessonMaxes) {
    const h = map.get(g.studentId);
    if (h && g._max.heldAt) {
      h.daysSinceLastLesson = Math.floor((now.getTime() - g._max.heldAt.getTime()) / 86_400_000);
    }
  }
  return map;
}

@QueryHandler(ListStudentsQuery)
export class ListStudentsHandler implements IQueryHandler<ListStudentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListStudentsQuery) {
    const { teacherUserId, search, classGroupId, status, noLessonSinceDays, limit = 50, offset = 0, sortBy } = query;
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
      const idsWithLesson = withRecentLesson.map((l: { studentId: string }) => l.studentId);
      where.id = { notIn: idsWithLesson };
    }
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { classGroup: { select: { id: true, name: true } } },
        orderBy: orderByForSort(sortBy),
        take: Math.min(limit, 100),
        skip: offset,
      }),
      this.prisma.student.count({ where }),
    ]);
    type Row = (typeof students)[number];
    const ids = students.map((s: Row) => s.id);
    const hintMap = await buildAttentionHintsMap(this.prisma, ids);
    return {
      items: students.map((s: Row) => ({
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
        attentionHints: hintMap.get(s.id) ?? {
          activeBlockersCount: 0,
          overdueGoalsCount: 0,
          daysSinceLastLesson: null,
        },
      })),
      total,
    };
  }
}
