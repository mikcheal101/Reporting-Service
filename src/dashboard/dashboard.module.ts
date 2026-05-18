import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAiService } from './dashboard-ai.service';
import { Report } from 'src/reports/entity/report.entity';
import { ReportDetail } from 'src/reports/entity/report-detail.entity';
import { Task } from 'src/tasks/entity/task.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { User } from 'src/users/entity/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportDetail, Task, ReportType, Connection, User]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardAiService],
})
export class DashboardModule {}
