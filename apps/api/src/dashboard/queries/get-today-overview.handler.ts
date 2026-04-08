import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetTodayOverviewQuery } from './get-today-overview.query';

@QueryHandler(GetTodayOverviewQuery)
export class GetTodayOverviewHandler implements IQueryHandler<GetTodayOverviewQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTodayOverviewQuery) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [allStudents, overdueGoals, todaySessions] = await Promise.all([
      this.prisma.student.findMany({
        where: { teacherUserId: query.teacherUserId, status: 'active' },
        select: {
          id: true,
          displayName: true,
          classGroup: { select: { id: true, name: true } },
          lessons: {
            orderBy: { heldAt: 'desc' },
            take: 1,
            select: { heldAt: true },
          },
        },
      }),
      this.prisma.goal.findMany({
        where: {
          teacherUserId: query.teacherUserId,
          status: { not: 'completed' },
          deadlineAt: { lt: now },
        },
        include: { student: { select: { id: true, displayName: true, classGroup: { select: { name: true } } } } },
        orderBy: { deadlineAt: 'asc' },
        take: 20,
      }),
      this.prisma.classSession.findMany({
        where: {
          teacherUserId: query.teacherUserId,
          heldAt: { gte: todayStart, lt: todayEnd },
        },
        include: {
          classGroup: { select: { id: true, name: true } },
          topic: { select: { name: true } },
          _count: { select: { attendances: true } },
        },
      }),
    ]);

    const noLessonStudents = allStudents.filter((s) => {
      const last = s.lessons[0]?.heldAt;
      return !last || last < sevenDaysAgo;
    });

    return {
      noLessonStudents: noLessonStudents.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        classGroup: s.classGroup,
        daysSinceLastLesson: s.lessons[0]?.heldAt
          ? Math.floor((now.getTime() - s.lessons[0].heldAt.getTime()) / (24 * 60 * 60 * 1000))
          : null,
      })),
      overdueGoals: overdueGoals.map((g) => ({
        id: g.id,
        title: g.title,
        deadlineAt: g.deadlineAt?.toISOString() ?? null,
        student: g.student,
      })),
      todaySessions: todaySessions.map((s) => ({
        id: s.id,
        classGroup: s.classGroup,
        topicName: s.topic?.name ?? null,
        durationMinutes: s.durationMinutes,
        heldAt: s.heldAt.toISOString(),
        attendanceCount: s._count.attendances,
      })),
    };
  }
}
