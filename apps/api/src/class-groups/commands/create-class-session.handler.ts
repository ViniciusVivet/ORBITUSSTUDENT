import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSessionCommand } from './create-class-session.command';

const XP_PER_LEVEL = 100;
const lessonStatuses = new Set<AttendanceStatus>([
  AttendanceStatus.present,
  AttendanceStatus.late,
  AttendanceStatus.makeup,
]);

@CommandHandler(CreateClassSessionCommand)
export class CreateClassSessionHandler implements ICommandHandler<CreateClassSessionCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateClassSessionCommand) {
    const group = await this.prisma.classGroup.findFirst({
      where: { id: command.classGroupId, teacherUserId: command.teacherUserId },
    });
    if (!group) throw new NotFoundException('Turma nao encontrada');

    const attendanceStudentIds = command.data.attendances.map((attendance) => attendance.studentId);
    if (attendanceStudentIds.length > 0) {
      const validStudents = await this.prisma.student.findMany({
        where: {
          id: { in: attendanceStudentIds },
          teacherUserId: command.teacherUserId,
          classGroupId: command.classGroupId,
        },
        select: { id: true },
      });
      const validIds = new Set(validStudents.map((student) => student.id));
      if (attendanceStudentIds.some((studentId) => !validIds.has(studentId))) {
        throw new NotFoundException('Aluno da chamada nao pertence a esta turma');
      }
    }

    const topic = command.data.topicId
      ? await this.prisma.topic.findUnique({
          where: { id: command.data.topicId },
          include: { skills: { select: { skillId: true } } },
        })
      : await this.prisma.topic.upsert({
          where: { slug: 'aula-livre' },
          update: {},
          create: { name: 'Aula Livre', slug: 'aula-livre', xpWeight: 1 },
          include: { skills: { select: { skillId: true } } },
        });

    if (command.data.topicId && !topic) throw new NotFoundException('Categoria nao encontrada');
    if (!topic) throw new NotFoundException('Categoria nao encontrada');

    const heldAt = new Date(command.data.heldAt);
    const progressAttendances = command.data.attendances.filter((attendance) => lessonStatuses.has(attendance.status));
    const progressStudentIds = progressAttendances.map((attendance) => attendance.studentId);
    const progressStudents = progressStudentIds.length
      ? await this.prisma.student.findMany({
          where: { id: { in: progressStudentIds }, teacherUserId: command.teacherUserId },
          select: { id: true, xp: true },
        })
      : [];
    const studentById = new Map(progressStudents.map((student) => [student.id, student]));
    const skillIds = topic.skills.map((topicSkill) => topicSkill.skillId);

    const session = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.classSession.create({
        data: {
          classGroupId: command.classGroupId,
          teacherUserId: command.teacherUserId,
          heldAt,
          durationMinutes: command.data.durationMinutes,
          topicId: topic.id,
          notes: command.data.notes ?? null,
        },
      });

      if (command.data.attendances.length > 0) {
        await tx.sessionAttendance.createMany({
          data: command.data.attendances.map((attendance) => ({
            sessionId: createdSession.id,
            studentId: attendance.studentId,
            status: attendance.status,
            note: attendance.note ?? null,
            grade: attendance.grade ?? null,
          })),
        });
      }

      for (const attendance of progressAttendances) {
        const student = studentById.get(attendance.studentId);
        if (!student) continue;

        const rating = this.resolveRating(attendance.status, attendance.grade);
        const xpEarned = Math.round(rating * command.data.durationMinutes * topic.xpWeight * 0.1);
        await tx.lesson.create({
          data: {
            studentId: attendance.studentId,
            teacherUserId: command.teacherUserId,
            heldAt,
            durationMinutes: command.data.durationMinutes,
            topicId: topic.id,
            rating,
            notes: this.buildLessonNotes(command.data.notes, attendance.note),
            xpEarned,
          },
        });

        const nextXp = student.xp + xpEarned;
        await tx.student.update({
          where: { id: attendance.studentId },
          data: {
            xp: nextXp,
            level: Math.floor(nextXp / XP_PER_LEVEL) + 1,
          },
        });

        if (skillIds.length > 0) {
          const xpPerSkill = Math.floor(xpEarned / skillIds.length);
          for (const skillId of skillIds) {
            const existing = await tx.skillProgress.findUnique({
              where: { studentId_skillId: { studentId: attendance.studentId, skillId } },
            });
            const newXp = (existing?.currentXp ?? 0) + xpPerSkill;
            await tx.skillProgress.upsert({
              where: { studentId_skillId: { studentId: attendance.studentId, skillId } },
              create: {
                studentId: attendance.studentId,
                skillId,
                currentXp: newXp,
                level: Math.floor(newXp / XP_PER_LEVEL) + 1,
              },
              update: {
                currentXp: newXp,
                level: Math.floor(newXp / XP_PER_LEVEL) + 1,
                updatedAt: new Date(),
              },
            });
          }
        }
      }

      return createdSession;
    });

    return {
      ...session,
      attendanceCount: command.data.attendances.length,
      lessonCount: progressAttendances.length,
    };
  }

  private resolveRating(status: AttendanceStatus, grade?: number) {
    if (typeof grade === 'number') {
      return Math.min(5, Math.max(1, Math.round(grade)));
    }

    if (status === AttendanceStatus.late) return 3;
    return 4;
  }

  private buildLessonNotes(sessionNotes?: string, attendanceNote?: string) {
    const notes = [sessionNotes?.trim(), attendanceNote?.trim()].filter(Boolean);
    return notes.length > 0 ? notes.join('\n\n') : null;
  }
}
