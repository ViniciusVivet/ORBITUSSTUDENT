import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClassGroupsController } from './class-groups.controller';
import { CreateClassGroupHandler } from './commands/create-class-group.handler';
import { CreateClassSessionHandler } from './commands/create-class-session.handler';
import { ListClassGroupsHandler } from './queries/list-class-groups.handler';
import { GetClassGroupDetailHandler } from './queries/get-class-group-detail.handler';

@Module({
  imports: [CqrsModule],
  controllers: [ClassGroupsController],
  providers: [
    CreateClassGroupHandler,
    CreateClassSessionHandler,
    ListClassGroupsHandler,
    GetClassGroupDetailHandler,
  ],
})
export class ClassGroupsModule {}
