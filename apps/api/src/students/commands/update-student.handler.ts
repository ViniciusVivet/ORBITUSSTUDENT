import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStudentCommand } from './update-student.command';

@CommandHandler(UpdateStudentCommand)
export class UpdateStudentHandler implements ICommandHandler<UpdateStudentCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateStudentCommand) {
    const existing = await this.prisma.student.findFirst({
      where: { id: command.studentId, teacherUserId: command.teacherUserId },
    });
    if (!existing) throw new NotFoundException('Aluno não encontrado');

    const data: Record<string, unknown> = {};
    if (command.data.displayName !== undefined) data.displayName = command.data.displayName.trim();
    if (command.data.fullName !== undefined) data.fullName = command.data.fullName?.trim() ?? null;
    if (command.data.classGroupId !== undefined) {
      if (command.data.classGroupId) {
        const group = await this.prisma.classGroup.findFirst({
          where: { id: command.data.classGroupId, teacherUserId: command.teacherUserId },
          select: { id: true },
        });
        if (!group) throw new NotFoundException('Turma nao encontrada');
      }
      data.classGroupId = command.data.classGroupId ?? null;
    }
    if (command.data.status !== undefined) data.status = command.data.status;
    if (command.data.weekDays !== undefined) data.weekDays = command.data.weekDays;
    if (command.data.courseStartAt !== undefined) data.courseStartAt = command.data.courseStartAt ? new Date(command.data.courseStartAt) : null;
    if (command.data.courseEndAt !== undefined) data.courseEndAt = command.data.courseEndAt ? new Date(command.data.courseEndAt) : null;

    return this.prisma.student.update({
      where: { id: command.studentId },
      data,
      include: { classGroup: { select: { id: true, name: true } } },
    });
  }
}
