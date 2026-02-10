import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StudentsController } from './students.controller';
import { ListStudentsHandler } from './queries/list-students.handler';
import { GetStudentByIdHandler } from './queries/get-student-by-id.handler';
import { GetStudentSummaryHandler } from './queries/get-student-summary.handler';
import { ListTopicsHandler } from './queries/list-topics.handler';
import { ListBlockersHandler } from './queries/list-blockers.handler';
import { ListGoalsHandler } from './queries/list-goals.handler';
import { CreateStudentHandler } from './commands/create-student.handler';
import { RegisterLessonHandler } from './commands/register-lesson.handler';
import { AddBlockerHandler } from './commands/add-blocker.handler';
import { UpdateBlockerHandler } from './commands/update-blocker.handler';
import { CreateGoalHandler } from './commands/create-goal.handler';
import { UpdateGoalHandler } from './commands/update-goal.handler';

const QueryHandlers = [
  ListStudentsHandler,
  GetStudentByIdHandler,
  GetStudentSummaryHandler,
  ListTopicsHandler,
  ListBlockersHandler,
  ListGoalsHandler,
];
const CommandHandlers = [
  CreateStudentHandler,
  RegisterLessonHandler,
  AddBlockerHandler,
  UpdateBlockerHandler,
  CreateGoalHandler,
  UpdateGoalHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [StudentsController],
  providers: [...QueryHandlers, ...CommandHandlers],
})
export class StudentsModule {}
