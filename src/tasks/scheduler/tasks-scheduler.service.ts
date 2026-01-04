import { Injectable, Logger } from '@nestjs/common';
import { Task } from '../entity/task.entity';
import { In, Repository } from 'typeorm';
import { TaskStatus } from '../entity/task-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TasksStatusService } from '../status/tasks-status.service';
import { TasksRunnerService } from '../runner/tasks-runner.service';
import { Frequency } from 'src/report-types/entity/frequency.enum';

@Injectable()
export class TasksSchedulerService {
  private readonly logger = new Logger(TasksSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly tasksStatusService: TasksStatusService,
    private readonly tasksRunnerService: TasksRunnerService,
  ) {}

  /**
   * Called automatically when the NestJS application starts.
   * Loads existing tasks and starts the polling process.
   */
  public async onApplicationBootstrap(): Promise<void> {
    try {
      this.logger.log('TasksSchedulerService bootstrapping...');
      await this.loadJobsFromDB();
      this.startPolling(); // polling interval defaults to 30s
    } catch (error) {
      this.logger.error(
        'Failed to bootstrap TasksSchedulerService',
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Poll the database periodically for new tasks or updates.
   * @param intervalMs Polling interval in milliseconds (default: 30 seconds)
   */
  public startPolling(intervalMs: number = 30000): void {
    setInterval(async () => {
      try {
        this.logger.log('Polling database for tasks to execute...');
        await this.loadJobsFromDB();
      } catch (error) {
        this.logger.error('Error during task polling', error.stack);
      }
    }, intervalMs);
  }

  /**
   * Load active tasks from the database and register their cron jobs.
   * Completed and failed tasks are re-run, scheduled tasks are registered.
   */
  private async loadJobsFromDB(): Promise<void> {
    // Reload completed and failed tasks to potentially rerun them
    const completedOrFailedTasks = await this.taskRepository.find({
      where: {
        active: true,
        status: In([TaskStatus.COMPLETED, TaskStatus.FAILED]),
      },
      relations: {
        report: {
          connection: true,
          reportType: true,
          reportDetails: true,
          parameters: true,
        },
      },
    });
    completedOrFailedTasks.forEach((task: Task) => {
      if (task.report?.reportType?.frequency !== Frequency.ON_REQUEST) {
        this.reRunCronJob(task);
      }
    });

    // Stop cron jobs for cancelled or expired tasks
    const stoppedTasks = await this.taskRepository.findBy({
      status: In([TaskStatus.CANCELLED, TaskStatus.EXPIRED]),
    });
    stoppedTasks.forEach((task: Task) => {
      this.stopCronJob(task);
    });

    // Load scheduled tasks and register them
    const scheduledTasks = await this.taskRepository.findBy({
      active: true,
      status: In([TaskStatus.SCHEDULED]),
    });
    scheduledTasks.forEach((task) => this.registerCronJob(task));
  }

  /**
   * Stop all tasks that have been cancelled.
   * @param task Task to stop.
   */
  private stopCronJob(task: Task): void {
    const taskKey = `task-${task.id}`;
    if (this.schedulerRegistry.doesExist('cron', taskKey)) {
      const existingJob = this.schedulerRegistry.getCronJob(taskKey);
      existingJob.stop();
      this.schedulerRegistry.deleteCronJob(taskKey);
      this.logger.log(`Re-running task: ${task.id}`);
    }
  }

  /**
   * Re-run an existing cron job.
   * Stops and removes the existing cron job before re-registering.
   * @param task Task to re-run
   */
  private reRunCronJob(task: Task): void {
    this.stopCronJob(task);
    this.registerCronJob(task);
  }

  /**
   * Register a new cron job for a task.
   * @param task Task to schedule
   */
  private registerCronJob(task: Task): void {
    const taskKey = `task-${task.id}`;
    const cronJob = this.createCronJob(task);

    this.schedulerRegistry.addCronJob(taskKey, cronJob);
    cronJob.start();
    this.logger.log(`Scheduled task: ${task.id} - ${task.name}`);
  }

  /**
   * Create a CronJob instance for a task.
   * Updates the task status to QUEUED before execution.
   * @param task Task to execute
   * @returns CronJob
   */
  private createCronJob(task: Task): CronJob {
    return new CronJob(task.cronExpression, async () => {
      try {
        this.logger.log(`Executing task: ${task.id} - ${task.name}`);

        // Mark task as QUEUED before execution
        await this.tasksStatusService.updateStatus(task.id, TaskStatus.QUEUED, [
          TaskStatus.SCHEDULED,
          TaskStatus.COMPLETED,
          TaskStatus.FAILED,
        ]);

        // Execute the actual task logic
        await this.tasksRunnerService.executeTask(task);
      } catch (error) {
        this.logger.error(
          `Error executing task ${task.id}: ${error.message}`,
          error.stack,
        );
      }
    });
  }
}
