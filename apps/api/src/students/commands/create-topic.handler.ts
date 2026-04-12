import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTopicCommand } from './create-topic.command';

function toSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'topico';
}

@CommandHandler(CreateTopicCommand)
export class CreateTopicHandler implements ICommandHandler<CreateTopicCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTopicCommand) {
    const name = command.name.trim();
    if (name.length < 2) throw new BadRequestException('Informe um nome com pelo menos 2 caracteres.');
    const slug = toSlug(name);
    const existing = await this.prisma.topic.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Ja existe um topico com o nome "${name}".`);

    return this.prisma.topic.create({
      data: { name, slug, xpWeight: 1 },
      select: { id: true, name: true, slug: true, xpWeight: true },
    });
  }
}
