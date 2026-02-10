import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetDashboardOverviewHandler } from './queries/get-dashboard-overview.handler';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [CqrsModule],
  controllers: [DashboardController],
  providers: [GetDashboardOverviewHandler],
})
export class DashboardModule {}
