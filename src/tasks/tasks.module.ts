import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { ReportsModule } from 'src/reports/reports.module';
import { MailModule } from 'src/mail/mail.module';
import { CronUtil } from 'src/common/utils/cron.utils';
import { TasksRunnerService } from './runner/tasks-runner.service';
import { TasksSchedulerService } from './scheduler/tasks-scheduler.service';
import { TasksStatusService } from './status/tasks-status.service';
import { DatabaseUtils } from 'src/common/utils/database.utils';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Task]),
    ReportsModule,
    MailModule,
  ],
  exports: [TasksService],
  providers: [
    TasksService,
    CronUtil,
    DatabaseUtils,
    TasksRunnerService,
    TasksSchedulerService,
    TasksStatusService,
  ],
  controllers: [TasksController],
})
export class TasksModule {}
