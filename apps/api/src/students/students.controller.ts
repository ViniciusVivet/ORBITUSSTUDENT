import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '@prisma/client';
import { ListStudentsQuery } from './queries/list-students.query';
import { GetStudentByIdQuery } from './queries/get-student-by-id.query';
import { GetStudentSummaryQuery } from './queries/get-student-summary.query';
import { ListTopicsQuery } from './queries/list-topics.query';
import { CreateStudentCommand } from './commands/create-student.command';
import { RegisterLessonCommand } from './commands/register-lesson.command';
import { AddBlockerCommand } from './commands/add-blocker.command';
import { UpdateBlockerCommand } from './commands/update-blocker.command';
import { CreateStudentDto } from './dto/create-student.dto';
import { RegisterLessonDto } from './dto/register-lesson.dto';
import { AddBlockerDto } from './dto/add-blocker.dto';
import { ListBlockersQuery } from './queries/list-blockers.query';
import { ListGoalsQuery } from './queries/list-goals.query';
import { CreateGoalCommand } from './commands/create-goal.command';
import { UpdateGoalCommand } from './commands/update-goal.command';
import { CreateGoalDto } from './dto/create-goal.dto';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VIEWER)
@Controller('students')
export class StudentsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('topics')
  @ApiOperation({ summary: 'Listar tópicos (para formulário de aula)' })
  async listTopics() {
    return this.queryBus.execute(new ListTopicsQuery());
  }

  @Get()
  @ApiOperation({ summary: 'Listar alunos' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.queryBus.execute(
      new ListStudentsQuery(user.id, search, classGroupId, status, limit, offset),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes do aluno' })
  async getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetStudentByIdQuery(id, user.id));
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Resumo do aluno (últimas 5 aulas, barras, bloqueios)' })
  async getSummary(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetStudentSummaryQuery(id, user.id));
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar aluno' })
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(
      new CreateStudentCommand(user.id, {
        displayName: dto.displayName,
        fullName: dto.fullName,
        classGroupId: dto.classGroupId,
        avatarType: dto.avatarType,
        avatarValue: dto.avatarValue,
      }),
    );
  }

  @Post(':id/lessons')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar aula do aluno' })
  async registerLesson(
    @Param('id') id: string,
    @Body() dto: RegisterLessonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new RegisterLessonCommand(id, user.id, {
        topicId: dto.topicId,
        heldAt: new Date(dto.heldAt),
        durationMinutes: dto.durationMinutes,
        rating: dto.rating,
        notes: dto.notes,
      }),
    );
  }

  @Get(':id/blockers')
  @ApiOperation({ summary: 'Listar bloqueios do aluno' })
  async listBlockers(
    @Param('id') id: string,
    @Query('status') status: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.queryBus.execute(new ListBlockersQuery(id, user.id, status));
  }

  @Post(':id/blockers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar bloqueio' })
  async addBlocker(
    @Param('id') id: string,
    @Body() dto: AddBlockerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new AddBlockerCommand(id, user.id, {
        titleOrTopic: dto.titleOrTopic,
        severity: dto.severity,
        tags: dto.tags,
        observation: dto.observation,
      }),
    );
  }

  @Patch(':id/blockers/:blockerId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar bloqueio (ex.: resolver)' })
  async updateBlocker(
    @Param('id') id: string,
    @Param('blockerId') blockerId: string,
    @Body() body: { status?: 'active' | 'resolved' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateBlockerCommand(id, blockerId, user.id, { status: body.status }),
    );
  }

  @Get(':id/goals')
  @ApiOperation({ summary: 'Listar metas do aluno' })
  async listGoals(
    @Param('id') id: string,
    @Query('status') status: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.queryBus.execute(new ListGoalsQuery(id, user.id, status));
  }

  @Post(':id/goals')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar meta' })
  async createGoal(
    @Param('id') id: string,
    @Body() dto: CreateGoalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new CreateGoalCommand(id, user.id, {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
      }),
    );
  }

  @Patch(':id/goals/:goalId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar meta (status: in_progress, completed)' })
  async updateGoal(
    @Param('id') id: string,
    @Param('goalId') goalId: string,
    @Body() body: { status?: 'pending' | 'in_progress' | 'completed' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateGoalCommand(id, goalId, user.id, { status: body.status }),
    );
  }
}
