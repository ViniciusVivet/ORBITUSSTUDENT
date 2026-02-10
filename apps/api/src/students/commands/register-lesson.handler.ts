import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterLessonCommand } from './register-lesson.command';

const XP_PER_LEVEL = 100;

@CommandHandler(RegisterLessonCommand)
export class RegisterLessonHandler implements ICommandHandler<RegisterLessonCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RegisterLessonCommand) {
    const { studentId, teacherUserId, data } = command;

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, teacherUserId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    const topic = await this.prisma.topic.findUnique({
      where: { id: data.topicId },
      include: { skills: { include: { skill: true } } },
    });
    if (!topic) throw new BadRequestException('Tópico não encontrado');

    const xpEarned = Math.round(
      data.rating * data.durationMinutes * topic.xpWeight * 0.1,
    );
    const heldAt = new Date(data.heldAt);

    const [lesson] = await this.prisma.$transaction([
      this.prisma.lesson.create({
        data: {
          studentId,
          teacherUserId,
          heldAt,
          durationMinutes: data.durationMinutes,
          topicId: data.topicId,
          rating: data.rating,
          notes: data.notes ?? null,
          xpEarned,
        },
        include: { topic: { select: { name: true } } },
      }),
      this.prisma.student.update({
        where: { id: studentId },
        data: {
          xp: student.xp + xpEarned,
          level: Math.floor((student.xp + xpEarned) / XP_PER_LEVEL) + 1,
        },
      }),
    ]);

    const skillIds = topic.skills.map((ts) => ts.skillId);
    if (skillIds.length > 0) {
      const xpPerSkill = Math.floor(xpEarned / skillIds.length);
      for (const skillId of skillIds) {
        const existing = await this.prisma.skillProgress.findUnique({
          where: { studentId_skillId: { studentId, skillId } },
        });
        const newXp = (existing?.currentXp ?? 0) + xpPerSkill;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
        await this.prisma.skillProgress.upsert({
          where: {
            studentId_skillId: { studentId, skillId },
          },
          create: {
            studentId,
            skillId,
            currentXp: newXp,
            level: newLevel,
          },
          update: {
            currentXp: newXp,
            level: newLevel,
            updatedAt: new Date(),
          },
        });
      }
    }

    return lesson;
  }
}
