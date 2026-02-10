import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetDashboardOverviewHandler } from './queries/get-dashboard-overview.handler';
import { GetDashboardByClassHandler } from './queries/get-dashboard-by-class.handler';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [CqrsModule],
  controllers: [DashboardController],
  providers: [GetDashboardOverviewHandler, GetDashboardByClassHandler],
})
export class DashboardModule {}
