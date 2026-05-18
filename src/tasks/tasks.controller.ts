import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
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
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.TASKS)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  public async scheduleTask(
    @Body() scheduleTaskRequestDto: ScheduleTaskRequestDto,
  ): Promise<void> {
    try {
      return await this.tasksService.scheduleTaskAsync(scheduleTaskRequestDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.PENDING_TASKS)
  public async pendingTasks(): Promise<Task[]> {
    try {
      return await this.tasksService.fetchPendingTasksAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.COMPLETED_TASKS)
  public async completedTasks(): Promise<Task[]> {
    try {
      return await this.tasksService.fetchCompletedTasksAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.DOWNLOAD_REPORT)
  public async downloadFile(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const filename = await this.tasksService.createDownloadPathAsync(
        Number.parseInt(id),
      );

      const filePath: string = join(__dirname, '..', 'media', filename);

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
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
