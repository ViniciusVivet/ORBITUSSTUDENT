import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateLessonCommand } from './update-lesson.command';

@CommandHandler(UpdateLessonCommand)
export class UpdateLessonHandler implements ICommandHandler<UpdateLessonCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateLessonCommand) {
    const { studentId, lessonId, teacherUserId, data } = command;

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, studentId, teacherUserId },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada.');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl } : {}),
      },
      include: { topic: { select: { name: true } } },
    });
  }
}
