import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entity/task.entity';
import { ReportsService } from 'src/reports/reports.service';
import { CronUtil } from 'src/common/utils/cron.utils';
import { ScheduleTaskRequestDto } from './dto/schedule-task.request.dto';
import { ReportDto } from 'src/reports/dto/report.dto';
import { TaskStatus } from './entity/task-status.enum';
import { DatabaseType } from 'src/connections/databasetype.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';
import { Frequency } from 'src/report-types/entity/frequency.enum';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let reportsService: ReportsService;
  let cronUtil: CronUtil;

  const mockFullConnectionDto = {
    id: 1,
    name: 'Test Connection',
    server: 'localhost',
    port: 1433,
    user: 'sa',
    password: 'password',
    database: 'testdb',
    databaseType: DatabaseType.MSSQL,
    isTestSuccessful: true,
  };

  const mockFullReportTypeDto = {
    id: 1,
    name: 'Daily',
    outputType: OutputFormat.PDF,
    frequency: Frequency.DAILY,
    runDate: '2025-01-01',
    runTime: '10:00',
    emailsToNotify: 'test@test.com',
  };

  const mockReportDto: ReportDto = {
    id: 1,
    name: 'Test Report',
    description: 'A test report',
    connectionId: 1,
    connection: mockFullConnectionDto,
    reportTypeId: 1,
    reportType: mockFullReportTypeDto,
    reportDetails: [],
    queryString: null,
  };

    const mockTask: Task = {
    id: 1,
    name: 'task-Test Report',
    report: { id: 1, name: 'Test Report' } as any,
    cronExpression: '0 10 * * *',
    active: true,
    status: TaskStatus.SCHEDULED,
    payload: null,
    duration: null,
    executedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockReportsService = {
    findOneAsync: jest.fn(),
  };

  const mockCronUtil = {
    dateToCron: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: CronUtil,
          useValue: mockCronUtil,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    reportsService = module.get<ReportsService>(ReportsService);
    cronUtil = module.get<CronUtil>(CronUtil);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleTaskAsync', () => {
    const scheduleDto: ScheduleTaskRequestDto = {
      reportId: 1,
      generateNow: true,
    };

    it('should schedule a task', async () => {
      mockReportsService.findOneAsync.mockResolvedValue(mockReportDto);
      mockTaskRepository.findOneBy.mockResolvedValue(null);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);
      mockCronUtil.dateToCron.mockReturnValue('0 10 * * *');

      await service.scheduleTaskAsync(scheduleDto);

      expect(mockTaskRepository.save).toHaveBeenCalled();
    });

    it('should throw when task already exists', async () => {
      mockReportsService.findOneAsync.mockResolvedValue(mockReportDto);
      mockTaskRepository.findOneBy.mockResolvedValue(mockTask);

      await expect(service.scheduleTaskAsync(scheduleDto)).rejects.toThrow(
        'Report already scheduled with id: 1!',
      );
    });

    it('should not save task when generateNow is false', async () => {
      const noGenerateDto: ScheduleTaskRequestDto = {
        reportId: 1,
        generateNow: false,
      };
      mockReportsService.findOneAsync.mockResolvedValue(mockReportDto);
      mockTaskRepository.findOneBy.mockResolvedValue(null);

      await service.scheduleTaskAsync(noGenerateDto);

      expect(mockTaskRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when report not found', async () => {
      mockReportsService.findOneAsync.mockResolvedValue(null);

      await expect(service.scheduleTaskAsync(scheduleDto)).rejects.toThrow(
        'Report with ID 1 not found',
      );
    });

    it('should propagate errors', async () => {
      mockReportsService.findOneAsync.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(service.scheduleTaskAsync(scheduleDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('fetchPendingTasksAsync', () => {
    it('should return pending tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.fetchPendingTasksAsync();

      expect(result).toHaveLength(1);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { active: true, status: TaskStatus.QUEUED },
        relations: { report: { reportType: true } },
      });
    });

    it('should return empty array when no pending tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.fetchPendingTasksAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockTaskRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.fetchPendingTasksAsync()).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('fetchCompletedTasksAsync', () => {
    it('should return completed tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.fetchCompletedTasksAsync();

      expect(result).toHaveLength(1);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { active: true, status: TaskStatus.COMPLETED },
        relations: { report: { reportType: true } },
      });
    });

    it('should return empty array when no completed tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.fetchCompletedTasksAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockTaskRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.fetchCompletedTasksAsync()).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('createDownloadPathAsync', () => {
    it('should create a download path for a task', async () => {
      const taskWithReport = {
        ...mockTask,
        report: {
          id: 1,
          name: 'Test Report',
          parameters: [],
          reportType: { outputType: OutputFormat.PDF },
        },
      };
      mockTaskRepository.findOne.mockResolvedValue(taskWithReport);

      const result = await service.createDownloadPathAsync(1);

      expect(result).toBe('Test_Report.pdf');
    });

    it('should throw when task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.createDownloadPathAsync(999)).rejects.toThrow(
        'Task not found',
      );
    });

    it('should throw when task has no report', async () => {
      mockTaskRepository.findOne.mockResolvedValue({
        ...mockTask,
        report: null,
      });

      await expect(service.createDownloadPathAsync(1)).rejects.toThrow(
        'Task report not found',
      );
    });

    it('should propagate errors', async () => {
      mockTaskRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.createDownloadPathAsync(1)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
