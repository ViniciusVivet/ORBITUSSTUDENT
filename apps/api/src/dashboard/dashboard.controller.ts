import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { Role } from '@prisma/client';
import { GetDashboardOverviewQuery } from './queries/get-dashboard-overview.query';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.VIEWER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('overview')
  @ApiOperation({ summary: 'Métricas do dashboard do professor' })
  async overview(@CurrentUser() user: JwtPayload) {
    return this.queryBus.execute(new GetDashboardOverviewQuery(user.id));
  }
}
