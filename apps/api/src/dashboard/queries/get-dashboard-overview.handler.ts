import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetDashboardOverviewQuery } from './get-dashboard-overview.query';

const DAYS_WITHOUT_LESSON = 7;

@QueryHandler(GetDashboardOverviewQuery)
export class GetDashboardOverviewHandler implements IQueryHandler<GetDashboardOverviewQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetDashboardOverviewQuery) {
    const { teacherUserId } = query;
    const since = new Date();
    since.setDate(since.getDate() - DAYS_WITHOUT_LESSON);

    const students = await this.prisma.student.findMany({
      where: { teacherUserId, status: 'active' },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);
    if (studentIds.length === 0) {
      return {
        cards: [
          { title: 'Alunos sem aula há 7+ dias', value: 0, subtitle: '' },
          { title: 'Top evolução (XP esta semana)', value: '—', subtitle: '' },
          { title: 'Top bloqueios por tópico', value: '—', subtitle: '' },
          { title: 'Tempo médio por tema', value: '—', subtitle: '' },
        ],
      };
    }

    const [lastLessonsPerStudent, lessonsLastWeek, blockersByTopic, avgDurationByTopic] = await Promise.all([
      this.prisma.lesson.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds } },
        _max: { heldAt: true },
      }),
      this.prisma.lesson.findMany({
        where: {
          studentId: { in: studentIds },
          heldAt: { gte: since },
        },
        select: { studentId: true, xpEarned: true },
      }),
      this.prisma.blocker.groupBy({
        by: ['titleOrTopic'],
        where: { studentId: { in: studentIds }, status: 'active' },
        _count: { id: true },
      }),
      this.prisma.lesson.groupBy({
        by: ['topicId'],
        where: { studentId: { in: studentIds } },
        _avg: { durationMinutes: true },
      }),
    ]);

    const lastLessonByStudent = new Map(lastLessonsPerStudent.map((g) => [g.studentId, g._max.heldAt]));
    let alunosSemAula = 0;
    for (const sid of studentIds) {
      const last = lastLessonByStudent.get(sid);
      if (!last || last < since) alunosSemAula++;
    }

    const xpByStudent = new Map<string, number>();
    for (const l of lessonsLastWeek) {
      xpByStudent.set(l.studentId, (xpByStudent.get(l.studentId) ?? 0) + l.xpEarned);
    }
    let topEvolucao = '—';
    let topEvolucaoXp = 0;
    if (xpByStudent.size > 0) {
      const sorted = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, displayName: true },
      });
      for (const s of sorted) {
        const xp = xpByStudent.get(s.id) ?? 0;
        if (xp > topEvolucaoXp) {
          topEvolucaoXp = xp;
          topEvolucao = s.displayName;
        }
      }
    }
    if (topEvolucao !== '—') topEvolucao = `${topEvolucao} (+${topEvolucaoXp} XP)`;

    const topBloqueio = [...blockersByTopic].sort((a, b) => b._count.id - a._count.id)[0];
    const topBloqueiosValue = topBloqueio ? `${topBloqueio.titleOrTopic} (${topBloqueio._count.id})` : '—';

    let tempoMedio = '—';
    if (avgDurationByTopic.length > 0) {
      const topicIds = avgDurationByTopic.map((g) => g.topicId);
      const topics = await this.prisma.topic.findMany({
        where: { id: { in: topicIds } },
        select: { id: true, name: true },
      });
      const byName = new Map(topics.map((t) => [t.id, t.name]));
      const avg = avgDurationByTopic[0];
      const name = byName.get(avg.topicId) ?? 'Tema';
      tempoMedio = `${Math.round(avg._avg.durationMinutes ?? 0)} min (${name})`;
    }

    return {
      cards: [
        { title: 'Alunos sem aula há 7+ dias', value: alunosSemAula, subtitle: `${DAYS_WITHOUT_LESSON} dias` },
        { title: 'Top evolução (XP esta semana)', value: topEvolucao, subtitle: '' },
        { title: 'Top bloqueios por tópico', value: topBloqueiosValue, subtitle: '' },
        { title: 'Tempo médio por tema', value: tempoMedio, subtitle: '' },
      ],
    };
  }
}
