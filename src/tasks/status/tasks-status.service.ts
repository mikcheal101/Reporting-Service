import { Injectable } from '@nestjs/common';
import { TaskStatus } from '../entity/task-status.enum';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entity/task.entity';

@Injectable()
export class TasksStatusService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  public updateStatusAsync = async (
    id: number,
    to: TaskStatus,
    from: TaskStatus[],
  ): Promise<void> => {
    await this.taskRepository.update(
      {
        id: id,
        status: In(from),
      },
      { status: to },
    );
  };
}
