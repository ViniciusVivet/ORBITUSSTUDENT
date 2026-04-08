import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '@prisma/client';
import { CreateClassGroupCommand } from './commands/create-class-group.command';
import { CreateClassSessionCommand } from './commands/create-class-session.command';
import { GetClassGroupDetailQuery } from './queries/get-class-group-detail.query';
import { ListClassGroupsQuery } from './queries/list-class-groups.query';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { CreateClassSessionDto } from './dto/create-class-session.dto';

@ApiTags('class-groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VIEWER)
@Controller('class-groups')
export class ClassGroupsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new ListClassGroupsQuery(user.id));
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateClassGroupDto, @CurrentUser() user: JwtPayload) {
    return this.commandBus.execute(new CreateClassGroupCommand(user.id, dto));
  }

  @Get(':id')
  async getDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetClassGroupDetailQuery(id, user.id));
  }

  @Post(':id/sessions')
  @Roles(Role.ADMIN)
  async createSession(
    @Param('id') classGroupId: string,
    @Body() dto: CreateClassSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commandBus.execute(new CreateClassSessionCommand(classGroupId, user.id, dto));
  }
}
