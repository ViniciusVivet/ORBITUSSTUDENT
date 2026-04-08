import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '@prisma/client';
import { ListStudentsQuery, type ListStudentsSortBy } from './queries/list-students.query';
import { GetAttentionQueueQuery } from './queries/get-attention-queue.query';
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
import { UpdateBlockerDto } from './dto/update-blocker.dto';
import { ListBlockersQuery } from './queries/list-blockers.query';
import { ListGoalsQuery } from './queries/list-goals.query';
import { ListClassGroupsQuery } from './queries/list-class-groups.query';
import { CreateGoalCommand } from './commands/create-goal.command';
import { UpdateGoalCommand } from './commands/update-goal.command';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateStudentCommand } from './commands/update-student.command';
import { GetStudentAttendanceQuery } from './queries/get-student-attendance.query';
import { UpsertAttendanceCommand } from './commands/upsert-attendance.command';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

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

  @Get('class-groups')
  @ApiOperation({ summary: 'Listar turmas (para cadastro e filtros)' })
  async listClassGroups(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new ListClassGroupsQuery(user.id));
  }

  @Get('attention-queue')
  @ApiOperation({ summary: 'Fila de atenção: alunos com bloqueio, meta atrasada ou sem aula recente' })
  async attentionQueue(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: number,
  ) {
    const lim = limit != null ? Number(limit) : 12;
    return this.queryBus.execute(new GetAttentionQueueQuery(user.id, Number.isFinite(lim) ? lim : 12));
  }

  @Get()
  @ApiOperation({ summary: 'Listar alunos' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('status') status?: string,
    @Query('noLessonSinceDays') noLessonSinceDays?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sortBy') sortByRaw?: string,
  ) {
    const days = noLessonSinceDays != null ? Number(noLessonSinceDays) : undefined;
    const sortBy: ListStudentsSortBy | undefined =
      sortByRaw === 'xp' || sortByRaw === 'level' || sortByRaw === 'name' ? sortByRaw : undefined;
    return this.queryBus.execute(
      new ListStudentsQuery(user.id, search, classGroupId, status, days, limit, offset, sortBy),
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
        weekDays: dto.weekDays,
        courseStartAt: dto.courseStartAt,
        courseEndAt: dto.courseEndAt,
      }),
    );
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar dados do aluno' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateStudentCommand(id, user.id, {
        displayName: dto.displayName,
        fullName: dto.fullName,
        classGroupId: dto.classGroupId,
        status: dto.status,
        weekDays: dto.weekDays,
        courseStartAt: dto.courseStartAt,
        courseEndAt: dto.courseEndAt,
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
    @Body() dto: UpdateBlockerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(
      new UpdateBlockerCommand(id, blockerId, user.id, {
        status: dto.status,
        observation: dto.observation,
        tags: dto.tags,
      }),
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

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Listar frequência do aluno por mês (YYYY-MM)' })
  async getAttendance(
    @Param('id') id: string,
    @Query('month') month: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const m = month ?? new Date().toISOString().substring(0, 7);
    return this.queryBus.execute(new GetStudentAttendanceQuery(id, user.id, m));
  }

  @Post(':id/attendance')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar/atualizar frequência do aluno' })
  async upsertAttendance(
    @Param('id') id: string,
    @Body() dto: UpsertAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(new UpsertAttendanceCommand(id, user.id, dto));
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
