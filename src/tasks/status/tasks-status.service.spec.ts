import { Test, TestingModule } from '@nestjs/testing';
import { TasksStatusService } from './tasks-status.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '../entity/task.entity';
import { TaskStatus } from '../entity/task-status.enum';

describe('TasksStatusService', () => {
  let service: TasksStatusService;
  let taskRepository: any;

  const mockTaskRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksStatusService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksStatusService>(TasksStatusService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  it('should update task status from one status to another', async () => {
    mockTaskRepository.update.mockResolvedValue({ affected: 1 });

    await service.updateStatusAsync(1, TaskStatus.COMPLETED, [
      TaskStatus.RUNNING,
    ]);

    expect(taskRepository.update).toHaveBeenCalledWith(
      { id: 1, status: expect.any(Object) },
      { status: TaskStatus.COMPLETED },
    );
  });

  it('should update task status from multiple possible source statuses', async () => {
    mockTaskRepository.update.mockResolvedValue({ affected: 1 });

    await service.updateStatusAsync(2, TaskStatus.QUEUED, [
      TaskStatus.SCHEDULED,
      TaskStatus.COMPLETED,
      TaskStatus.FAILED,
    ]);

    expect(taskRepository.update).toHaveBeenCalledWith(
      { id: 2, status: expect.any(Object) },
      { status: TaskStatus.QUEUED },
    );
  });

  it('should handle repository errors gracefully', async () => {
    mockTaskRepository.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      service.updateStatusAsync(3, TaskStatus.FAILED, [TaskStatus.RUNNING]),
    ).rejects.toThrow('Update failed');
  });

  it('should work with QUEUED to RUNNING transition', async () => {
    mockTaskRepository.update.mockResolvedValue({ affected: 1 });

    await service.updateStatusAsync(4, TaskStatus.RUNNING, [TaskStatus.QUEUED]);

    expect(taskRepository.update).toHaveBeenCalledWith(
      { id: 4, status: expect.any(Object) },
      { status: TaskStatus.RUNNING },
    );
  });
});
