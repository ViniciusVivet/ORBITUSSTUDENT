import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [CqrsModule, PrismaModule, AuthModule, StudentsModule, DashboardModule, AiModule],
})
export class AppModule {}
