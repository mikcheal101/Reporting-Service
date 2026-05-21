import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ScheduleTaskRequestDto } from './dto/schedule-task.request.dto';
import { AuthGuard } from 'src/auth/guard/auth.guard';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    scheduleTaskAsync: jest.fn(),
    fetchPendingTasksAsync: jest.fn(),
    fetchCompletedTasksAsync: jest.fn(),
    createDownloadPathAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).overrideGuard(AuthGuard).useValue({ canActivate: jest.fn(() => true) }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('scheduleTask', () => {
    const scheduleDto: ScheduleTaskRequestDto = {
      reportId: 1,
      generateNow: true,
    };

    it('should schedule a task', async () => {
      mockTasksService.scheduleTaskAsync.mockResolvedValue(undefined);

      const result = await controller.scheduleTask(scheduleDto);

      expect(result).toBeUndefined();
      expect(mockTasksService.scheduleTaskAsync).toHaveBeenCalledWith(
        scheduleDto,
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockTasksService.scheduleTaskAsync.mockRejectedValue(
        new Error('Schedule failed'),
      );

      await expect(controller.scheduleTask(scheduleDto)).rejects.toThrow(
        'Schedule failed',
      );
    });
  });

  describe('pendingTasks', () => {
    it('should return pending tasks', async () => {
      mockTasksService.fetchPendingTasksAsync.mockResolvedValue([
        { id: 1, name: 'task-1' },
      ] as any);

      const result = await controller.pendingTasks();

      expect(result).toHaveLength(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockTasksService.fetchPendingTasksAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.pendingTasks()).rejects.toThrow('Fetch failed');
    });
  });

  describe('completedTasks', () => {
    it('should return completed tasks', async () => {
      mockTasksService.fetchCompletedTasksAsync.mockResolvedValue([
        { id: 2, name: 'task-2' },
      ] as any);

      const result = await controller.completedTasks();

      expect(result).toHaveLength(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockTasksService.fetchCompletedTasksAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.completedTasks()).rejects.toThrow('Fetch failed');
    });
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      mockTasksService.createDownloadPathAsync.mockResolvedValue(
        'Test_Report.pdf',
      );

      const mockResponse = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as any;

      await controller.downloadFile('1', mockResponse);

      expect(mockTasksService.createDownloadPathAsync).toHaveBeenCalledWith(1);
      expect(mockResponse.sendFile).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(7);
    });

    it('should throw BadRequestException when service fails', async () => {
      mockTasksService.createDownloadPathAsync.mockRejectedValue(
        new Error('File not found'),
      );

      const mockResponse = {} as any;
      await expect(controller.downloadFile('1', mockResponse)).rejects.toThrow(
        'File not found',
      );
    });
  });
});
