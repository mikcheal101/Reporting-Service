import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ScheduleTaskRequestDto } from './dto/schedule-task.request.dto';
import { Task } from './entity/task.entity';
import { Response } from 'express';
import { join } from 'node:path';

@Controller('/api/v1/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  public async scheduleTask(
    @Body() scheduleTaskRequestDto: ScheduleTaskRequestDto,
  ): Promise<void> {
    try {
      return await this.tasksService.scheduleTask(scheduleTaskRequestDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('pending-tasks')
  public async pendingTasks(): Promise<Task[]> {
    try {
      return await this.tasksService.fetchPendingTasks();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('completed-tasks')
  public async completedTasks(): Promise<Task[]> {
    try {
      return await this.tasksService.fetchCompletedTasks();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('download-report/:id')
  public async downloadFile(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const filename = await this.tasksService.createDownloadPath(
        Number.parseInt(id),
      );

      const filePath: string = join(__dirname, '..', 'media', filename);
      console.log('filename: ', filename);
      console.log('filepath: ', filePath);

      // set headers and download
      response.setHeader(
        'cache-control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      response.setHeader(
        'access-control-expose-headers',
        'content-disposition',
      );
      response.setHeader('pragma', 'no-cache');
      response.setHeader('expires', '0');
      response.setHeader('surrogate-control', 'no-store');
      response.setHeader(
        'content-disposition',
        `attachment; filename:${filename}`,
      );
      response.setHeader('content-type', 'application/octet-stream');
      response.sendFile(filePath);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
