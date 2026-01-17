import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entity/task.entity';
import { Repository } from 'typeorm';
import { ScheduleTaskRequestDto } from './dto/schedule-task.request.dto';
import { ReportsService } from 'src/reports/reports.service';
import { ReportDto } from 'src/reports/dto/report.dto';
import { TaskStatus } from './entity/task-status.enum';
import { CronUtil } from 'src/common/utils/cron.utils';
import { FileFormatFactory } from 'src/common/utils/file-format.factory';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly reportService: ReportsService,
    private readonly cronUtil: CronUtil,
  ) {}

  private readonly createTaskAsync = async (
    report: ReportDto,
  ): Promise<Task> => {
    const dateTime: Date = new Date(
      `${report.reportType?.runDate}T${report.reportType?.runTime}`,
    );
    // create a task in the database
    const task: Task = this.taskRepository.create({
      report: {
        id: report.id,
      },
      status: TaskStatus.SCHEDULED,
      name: `task-${report.name}`,
      cronExpression: this.cronUtil.dateToCron(
        dateTime,
        report.reportType.frequency,
      ),
    });

    return task;
  };

  public scheduleTaskAsync = async (
    scheduleTaskRequestDto: ScheduleTaskRequestDto,
  ): Promise<void> => {
    try {
      // check if task exists
      const report = await this.getReportAsync(scheduleTaskRequestDto);

      const exists = await this.taskRepository.findOneBy({
        report: { id: report.id },
      });

      if (exists) {
        const errorMessage: string = `Report already scheduled with id: ${exists.id}!`;
        this.logger.warn(errorMessage);
        throw new Error(errorMessage);
      }

      if (scheduleTaskRequestDto.generateNow) {
        this.logger.log(`scheduling task: ${scheduleTaskRequestDto.reportId}.`);

        const task: Task = await this.createTaskAsync(report);

        await this.taskRepository.save(task);
      }
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error.message);
    }
  };

  public fetchPendingTasksAsync = async (): Promise<Task[]> => {
    try {
      return await this.taskRepository.find({
        where: {
          active: true,
          status: TaskStatus.QUEUED,
        },
        relations: {
          report: {
            reportType: true,
          },
        },
      });
    } catch (error) {
      this.logger.error(error.message, error);
      throw new Error(error.message);
    }
  };

  public fetchCompletedTasksAsync = async (): Promise<Task[]> => {
    try {
      return await this.taskRepository.find({
        where: {
          active: true,
          status: TaskStatus.COMPLETED,
        },
        relations: {
          report: {
            reportType: true,
          },
        },
      });
    } catch (error) {
      this.logger.error(error.message, error);
      throw new Error(error.message);
    }
  };

  public createDownloadPathAsync = async (id: number): Promise<string> => {
    try {
      // fetch task
      const task = await this.taskRepository.findOne({
        where: {
          id,
          active: true,
        },
        relations: {
          report: {
            parameters: true,
            reportType: true,
          },
        },
      });

      if (!task) {
        this.logger.error(`Task not found with id: ${id}`);
        throw new Error('Task not found!');
      }

      if (!task.report) {
        this.logger.error(`Task Report not found with task id: ${id}`);
        throw new Error('Task Report not found!');
      }

      const fileExtension: string = FileFormatFactory.create(
        task.report.reportType.outputType,
      );
      const filename: string = `${task.report.name.replaceAll(' ', '_')}${fileExtension}`;
      return filename;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  private readonly getReportAsync = async (
    scheduleTaskRequestDto: ScheduleTaskRequestDto,
  ): Promise<ReportDto> => {
    //get the report.
    const report: ReportDto = await this.reportService.findOneAsync(
      scheduleTaskRequestDto.reportId,
    );

    if (!report) {
      throw new Error(
        `Report with id: ${scheduleTaskRequestDto.reportId} not found!`,
      );
    }

    return report;
  };
}
