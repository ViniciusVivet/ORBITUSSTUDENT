import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassGroupCommand } from './create-class-group.command';

@CommandHandler(CreateClassGroupCommand)
export class CreateClassGroupHandler implements ICommandHandler<CreateClassGroupCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateClassGroupCommand) {
    return this.prisma.classGroup.create({
      data: {
        name: command.data.name,
        course: command.data.course ?? null,
        academicPeriod: command.data.academicPeriod ?? null,
      },
    });
  }
}
