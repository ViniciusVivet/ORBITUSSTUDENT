import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { GetDashboardByClassQuery } from './get-dashboard-by-class.query';

@QueryHandler(GetDashboardByClassQuery)
export class GetDashboardByClassHandler implements IQueryHandler<GetDashboardByClassQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetDashboardByClassQuery) {
    const students = await this.prisma.student.findMany({
      where: { teacherUserId: query.teacherUserId, status: 'active' },
      select: {
        id: true,
        classGroupId: true,
        classGroup: { select: { id: true, name: true } },
        xp: true,
        blockers: { where: { status: 'active' }, select: { id: true } },
      },
    });

    const byGroup = new Map<string, { classGroupId: string; classGroupName: string; studentCount: number; totalXp: number; activeBlockers: number }>();

    for (const s of students) {
      const gid = s.classGroupId ?? '_sem_turma';
      const gname = s.classGroup?.name ?? 'Sem turma';
      const cur = byGroup.get(gid) ?? { classGroupId: gid, classGroupName: gname, studentCount: 0, totalXp: 0, activeBlockers: 0 };
      cur.studentCount += 1;
      cur.totalXp += s.xp ?? 0;
      cur.activeBlockers += s.blockers.length;
      byGroup.set(gid, cur);
    }

    return Array.from(byGroup.values()).sort((a, b) => a.classGroupName.localeCompare(b.classGroupName));
  }
}
