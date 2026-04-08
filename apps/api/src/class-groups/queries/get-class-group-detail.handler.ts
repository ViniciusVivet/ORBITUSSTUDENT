import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetClassGroupDetailQuery } from './get-class-group-detail.query';

@QueryHandler(GetClassGroupDetailQuery)
export class GetClassGroupDetailHandler implements IQueryHandler<GetClassGroupDetailQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetClassGroupDetailQuery) {
    const group = await this.prisma.classGroup.findUnique({
      where: { id: query.classGroupId },
      include: {
        students: {
          where: { status: 'active' },
          orderBy: { displayName: 'asc' },
          select: {
            id: true,
            displayName: true,
            fullName: true,
            avatarType: true,
            avatarValue: true,
            level: true,
            xp: true,
            status: true,
            weekDays: true,
            courseStartAt: true,
            courseEndAt: true,
          },
        },
        sessions: {
          include: {
            topic: { select: { name: true } },
            _count: { select: { attendances: true } },
          },
          orderBy: { heldAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!group) throw new NotFoundException('Turma não encontrada');

    return {
      ...group,
      students: group.students.map((s) => ({
        ...s,
        courseStartAt: s.courseStartAt?.toISOString() ?? null,
        courseEndAt: s.courseEndAt?.toISOString() ?? null,
      })),
      sessions: group.sessions.map((s) => ({
        id: s.id,
        classGroupId: s.classGroupId,
        heldAt: s.heldAt.toISOString(),
        durationMinutes: s.durationMinutes,
        topicName: s.topic?.name ?? null,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        attendanceCount: s._count.attendances,
      })),
    };
  }
}
