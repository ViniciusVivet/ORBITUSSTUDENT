import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetAttentionQueueQuery } from './get-attention-queue.query';

type Hints = {
  activeBlockersCount: number;
  overdueGoalsCount: number;
  daysSinceLastLesson: number | null;
};

function computeScore(h: Hints, noRecentLessonIn7Days: boolean): number {
  let s = 0;
  s += h.activeBlockersCount * 3;
  s += h.overdueGoalsCount * 2;
  if (noRecentLessonIn7Days) {
    if (h.daysSinceLastLesson === null) s += 5;
    else if (h.daysSinceLastLesson >= 7) s += 3;
    else s += 1;
  }
  return s;
}

@QueryHandler(GetAttentionQueueQuery)
export class GetAttentionQueueHandler implements IQueryHandler<GetAttentionQueueQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAttentionQueueQuery) {
    const { teacherUserId, limit } = query;
    const cap = Math.min(Math.max(limit, 1), 30);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);

    const activeStudents = await this.prisma.student.findMany({
      where: { teacherUserId, status: 'active' },
      select: { id: true, displayName: true, classGroup: { select: { id: true, name: true } } },
    });
    const ids = activeStudents.map((s) => s.id);
    if (ids.length === 0) return [];

    const [blockerGroups, overdueGroups, lessonMaxes, recentLessons] = await Promise.all([
      this.prisma.blocker.groupBy({
        by: ['studentId'],
        where: { studentId: { in: ids }, status: 'active' },
        _count: { _all: true },
      }),
      this.prisma.goal.groupBy({
        by: ['studentId'],
        where: {
          studentId: { in: ids },
          status: { not: 'completed' },
          deadlineAt: { not: null, lt: startOfToday },
        },
        _count: { _all: true },
      }),
      this.prisma.lesson.groupBy({
        by: ['studentId'],
        where: { studentId: { in: ids } },
        _max: { heldAt: true },
      }),
      this.prisma.lesson.findMany({
        where: { studentId: { in: ids }, heldAt: { gte: since7 } },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    const recentSet = new Set(recentLessons.map((l) => l.studentId));

    const hintById = new Map<string, Hints>();
    for (const id of ids) {
      hintById.set(id, {
        activeBlockersCount: 0,
        overdueGoalsCount: 0,
        daysSinceLastLesson: null,
      });
    }
    for (const g of blockerGroups) {
      const h = hintById.get(g.studentId);
      if (h) h.activeBlockersCount = g._count._all;
    }
    for (const g of overdueGroups) {
      const h = hintById.get(g.studentId);
      if (h) h.overdueGoalsCount = g._count._all;
    }
    const now = new Date();
    for (const g of lessonMaxes) {
      const h = hintById.get(g.studentId);
      if (h && g._max.heldAt) {
        h.daysSinceLastLesson = Math.floor((now.getTime() - g._max.heldAt.getTime()) / 86_400_000);
      }
    }

    const out: Array<{
      studentId: string;
      displayName: string;
      classGroup: { id: string; name: string } | null;
      reasons: string[];
      score: number;
    }> = [];

    for (const st of activeStudents) {
      const h = hintById.get(st.id)!;
      const noRecent = !recentSet.has(st.id);
      const score = computeScore(h, noRecent);
      if (score === 0) continue;

      const reasons: string[] = [];
      if (h.activeBlockersCount > 0) {
        reasons.push(
          h.activeBlockersCount === 1 ? 'Bloqueio ativo' : `${h.activeBlockersCount} bloqueios ativos`,
        );
      }
      if (h.overdueGoalsCount > 0) {
        reasons.push(
          h.overdueGoalsCount === 1 ? 'Meta atrasada' : `${h.overdueGoalsCount} metas atrasadas`,
        );
      }
      if (noRecent) {
        if (h.daysSinceLastLesson === null) reasons.push('Sem aula registrada');
        else reasons.push(`Sem aula nos últimos 7 dias (há ${h.daysSinceLastLesson}d da última)`);
      }

      out.push({
        studentId: st.id,
        displayName: st.displayName,
        classGroup: st.classGroup,
        reasons,
        score,
      });
    }

    out.sort((a, b) => b.score - a.score);
    return out.slice(0, cap);
  }
}
