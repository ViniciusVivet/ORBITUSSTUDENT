import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBlockerCommand } from './update-blocker.command';

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const s = typeof t === 'string' ? t.trim() : '';
    if (!s || s.length > 48) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= 24) break;
  }
  return out;
}

@CommandHandler(UpdateBlockerCommand)
export class UpdateBlockerHandler implements ICommandHandler<UpdateBlockerCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateBlockerCommand) {
    const blocker = await this.prisma.blocker.findFirst({
      where: {
        id: command.blockerId,
        studentId: command.studentId,
        student: { teacherUserId: command.teacherUserId },
      },
    });
    if (!blocker) throw new NotFoundException('Bloqueio não encontrado');

    const hasPatch =
      command.data.status !== undefined ||
      command.data.observation !== undefined ||
      command.data.tags !== undefined;
    if (!hasPatch) return blocker;

    const data: {
      status?: 'active' | 'resolved';
      resolvedAt?: Date | null;
      observation?: string | null;
      tags?: string[];
    } = {};

    if (command.data.status === 'resolved') {
      data.status = 'resolved';
      data.resolvedAt = new Date();
    } else if (command.data.status === 'active') {
      data.status = 'active';
      data.resolvedAt = null;
    }

    if (command.data.observation !== undefined) {
      const o = command.data.observation;
      data.observation = o === null || (typeof o === 'string' && o.trim() === '') ? null : String(o).trim();
    }

    if (command.data.tags !== undefined) {
      data.tags = normalizeTags(command.data.tags);
    }

    return this.prisma.blocker.update({
      where: { id: command.blockerId },
      data,
    });
  }
}
