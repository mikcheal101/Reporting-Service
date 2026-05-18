import { Test, TestingModule } from '@nestjs/testing';
import { TasksSchedulerService } from './tasks-scheduler.service';
import { TasksStatusService } from '../status/tasks-status.service';
import { TasksRunnerService } from '../runner/tasks-runner.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entity/task.entity';
import { TaskStatus } from '../entity/task-status.enum';
import { Frequency } from 'src/report-types/entity/frequency.enum';
import { CronJob } from 'cron';

let cronJobInstance: any;

const createCronJobMock = () => {
  cronJobInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    cronTime: { source: '0 0 * * * *' },
    nextDate: jest.fn().mockReturnValue({ toString: () => '2025-01-01' }),
    lastExecution: null,
  };
  return cronJobInstance;
};

jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation((_expr, _callback) => {
    const instance = createCronJobMock();
    return instance;
  }),
}));

jest.mock('cron-validator', () => ({
  isValidCron: jest.fn().mockReturnValue(true),
}));

describe('TasksSchedulerService', () => {
  let service: TasksSchedulerService;
  let taskRepository: any;
  let schedulerRegistry: any;
  let tasksStatusService: TasksStatusService;
  let tasksRunnerService: TasksRunnerService;

  const mockTaskRepository = {
    find: jest.fn(),
  };

  const mockSchedulerRegistry = {
    doesExist: jest.fn().mockReturnValue(false),
    getCronJob: jest.fn(),
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    createCronJobMock();

    const { isValidCron } = require('cron-validator');
    (isValidCron as jest.Mock).mockReturnValue(true);

    mockSchedulerRegistry.doesExist.mockReturnValue(false);
    mockSchedulerRegistry.getCronJob.mockReturnValue(cronJobInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksSchedulerService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: TasksStatusService,
          useValue: {
            updateStatusAsync: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: TasksRunnerService,
          useValue: {
            executeTaskAsync: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TasksSchedulerService>(TasksSchedulerService);
    taskRepository = module.get(getRepositoryToken(Task));
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry as any);
    tasksStatusService = module.get<TasksStatusService>(TasksStatusService);
    tasksRunnerService = module.get<TasksRunnerService>(TasksRunnerService);
  });

  const createMockTask = (overrides: Partial<Task> = {}): Task => {
    const task = Object.assign(new Task(), {
      id: 1,
      name: 'Test Task',
      cronExpression: '0 0 * * * *',
      active: true,
      status: TaskStatus.SCHEDULED,
      report: {
        id: 1,
        name: 'Test Report',
        queryString: 'SELECT 1',
        connection: { id: 1 },
        reportType: {
          id: 1,
          name: 'daily',
          frequency: Frequency.DAILY,
          outputType: 0,
          emails: 'test@test.com',
        },
        reportDetails: [],
        parameters: [],
      },
      ...overrides,
    });
    return task;
  };

  describe('onApplicationBootstrap', () => {
    it('should load jobs and start polling', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      await service.onApplicationBootstrap();

      expect(mockTaskRepository.find).toHaveBeenCalled();
    });

    it('should throw error when bootstrap fails', async () => {
      mockTaskRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('startPolling', () => {
    it('should set interval and load jobs', async () => {
      jest.useFakeTimers();
      mockTaskRepository.find.mockResolvedValue([]);

      service.startPolling(100);
      jest.advanceTimersByTime(100);

      expect(mockTaskRepository.find).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('loadJobsFromDBAsync', () => {
    it('should handle completed/failed tasks and re-run cron jobs', async () => {
      const completedTask = createMockTask({
        id: 1,
        status: TaskStatus.COMPLETED,
      });
      mockTaskRepository.find
        .mockResolvedValueOnce([completedTask])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service['loadJobsFromDBAsync']();

      expect(mockTaskRepository.find).toHaveBeenCalledTimes(3);
    });

    it('should not re-run ON_REQUEST tasks', async () => {
      const task = createMockTask({
        id: 2,
        status: TaskStatus.COMPLETED,
      });
      task.report.reportType.frequency = Frequency.ON_REQUEST;

      mockTaskRepository.find
        .mockResolvedValueOnce([task])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service['loadJobsFromDBAsync']();

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should stop cron jobs for cancelled tasks', async () => {
      const cancelledTask = createMockTask({
        id: 3,
        status: TaskStatus.CANCELLED,
      });
      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      mockTaskRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([cancelledTask])
        .mockResolvedValueOnce([]);

      await service['loadJobsFromDBAsync']();

      expect(mockSchedulerRegistry.doesExist).toHaveBeenCalledWith(
        'cron',
        'task-3',
      );
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'task-3',
      );
    });

    it('should register cron jobs for scheduled tasks', async () => {
      const scheduledTask = createMockTask({
        id: 4,
        status: TaskStatus.SCHEDULED,
      });

      mockTaskRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([scheduledTask]);

      await service['loadJobsFromDBAsync']();

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'task-4',
        expect.any(Object),
      );
    });

    it('should skip scheduling if cron expression already exists with same value', async () => {
      const scheduledTask = createMockTask({
        id: 5,
        status: TaskStatus.SCHEDULED,
      });
      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      mockTaskRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([scheduledTask]);

      await service['loadJobsFromDBAsync']();

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('createCronJob', () => {
    it('should throw when cron expression is missing', () => {
      const task = createMockTask({ cronExpression: null });

      expect(() => service['createCronJob'](task)).toThrow(
        'Cron expression is missing for the task',
      );
    });

    it('should throw when cron expression is invalid', () => {
      const { isValidCron } = require('cron-validator');
      (isValidCron as jest.Mock).mockReturnValueOnce(false);

      const task = createMockTask({ cronExpression: 'invalid' });

      expect(() => service['createCronJob'](task)).toThrow(
        'Invalid cron expression',
      );
    });

    it('should create and register a cron job', () => {
      const task = createMockTask();
      const cronJob = service['createCronJob'](task);

      expect(cronJob).toBeDefined();
    });

    it('should update status to QUEUED when cron fires', async () => {
      const task = createMockTask();
      service['createCronJob'](task);

      const cronCallback = (CronJob as unknown as jest.Mock).mock.calls[0][1];
      await cronCallback();

      expect(tasksStatusService.updateStatusAsync).toHaveBeenCalledWith(
        task.id,
        TaskStatus.QUEUED,
        [TaskStatus.SCHEDULED, TaskStatus.COMPLETED, TaskStatus.FAILED],
      );
      expect(tasksRunnerService.executeTaskAsync).toHaveBeenCalledWith(task);
    });

    it('should handle errors during cron execution', async () => {
      jest
        .spyOn(tasksRunnerService, 'executeTaskAsync')
        .mockRejectedValue(new Error('Execution failed'));

      const task = createMockTask();
      service['createCronJob'](task);

      const cronCallback = (CronJob as unknown as jest.Mock).mock.calls[0][1];
      await expect(cronCallback()).rejects.toThrow('Execution failed');
    });
  });

  describe('registerCronJob', () => {
    it('should register a new cron job', () => {
      const task = createMockTask();
      service['registerCronJob'](task);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'task-1',
        expect.any(Object),
      );
    });

    it('should skip registration if same cron expression already exists', () => {
      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      const task = createMockTask();
      service['registerCronJob'](task);

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('should re-register if cron expression changed', () => {
      mockSchedulerRegistry.doesExist.mockReturnValue(true);
      const differentCronJob = {
        ...cronJobInstance,
        cronTime: { source: 'old-expression' },
      };
      mockSchedulerRegistry.getCronJob.mockReturnValue(differentCronJob);

      const task = createMockTask({ cronExpression: 'new-expression' });
      service['registerCronJob'](task);

      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'task-1',
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'task-1',
        expect.any(Object),
      );
    });
  });

  describe('stopCronJob', () => {
    it('should stop and delete existing cron job', () => {
      mockSchedulerRegistry.doesExist.mockReturnValue(true);

      const task = createMockTask();
      service['stopCronJob'](task);

      expect(cronJobInstance.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'task-1',
      );
    });

    it('should not stop non-existent cron job', () => {
      mockSchedulerRegistry.doesExist.mockReturnValue(false);

      const task = createMockTask();
      service['stopCronJob'](task);

      expect(cronJobInstance.stop).not.toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).not.toHaveBeenCalled();
    });
  });

  describe('reRunCronJob', () => {
    it('should stop and re-register cron job', () => {
      const differentCronJob = {
        ...cronJobInstance,
        cronTime: { source: 'old-expression' },
      };
      mockSchedulerRegistry.doesExist.mockReturnValue(true);
      mockSchedulerRegistry.getCronJob.mockReturnValue(differentCronJob);
      const task = createMockTask();
      service['reRunCronJob'](task);

      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'task-1',
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });
  });
});
