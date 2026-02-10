import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetStudentSummaryQuery } from './get-student-summary.query';

@QueryHandler(GetStudentSummaryQuery)
export class GetStudentSummaryHandler implements IQueryHandler<GetStudentSummaryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStudentSummaryQuery) {
    const student = await this.prisma.student.findFirst({
      where: { id: query.studentId, teacherUserId: query.teacherUserId },
      include: { classGroup: { select: { id: true, name: true } } },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const [lastLessons, skillProgress, activeBlockersCount, activeGoalsCount] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { studentId: query.studentId },
        orderBy: { heldAt: 'desc' },
        take: 5,
        include: { topic: { select: { name: true } } },
      }),
      this.prisma.skillProgress.findMany({
        where: { studentId: query.studentId },
        include: { skill: true },
      }),
      this.prisma.blocker.count({
        where: { studentId: query.studentId, status: 'active' },
      }),
      this.prisma.goal.count({
        where: { studentId: query.studentId, status: { in: ['pending', 'in_progress'] } },
      }),
    ]);

    return {
      student: {
        id: student.id,
        displayName: student.displayName,
        fullName: student.fullName,
        avatarType: student.avatarType,
        avatarValue: student.avatarValue,
        photoUrl: student.photoUrl,
        level: student.level,
        xp: student.xp,
        status: student.status,
        classGroup: student.classGroup,
      },
      lastLessons: lastLessons.map((l) => ({
        id: l.id,
        heldAt: l.heldAt.toISOString(),
        durationMinutes: l.durationMinutes,
        topicName: l.topic.name,
        rating: l.rating,
        xpEarned: l.xpEarned,
      })),
      skillBars: skillProgress.map((sp) => ({
        skillId: sp.skill.id,
        skillName: sp.skill.name,
        color: sp.skill.color,
        currentXp: sp.currentXp,
        level: sp.level ?? 1,
      })),
      activeBlockersCount,
      activeGoalsCount,
    };
  }
}
