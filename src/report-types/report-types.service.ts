// report-types/report-types.service.ts

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportType } from './entity/report-types.entity';
import { Repository } from 'typeorm';
import { CreateReportTypeRequestDto } from './dto/create-report-type.request.dto';
import { UpdateReportTypeRequestDto } from './dto/update-report-type.request.dto';
import { ReportTypeDto } from './dto/report-type.dto';
import { ReportTypeUtils } from './utils/report-type.utils';
import { CronUtil } from 'src/common/utils/cron.utils';
import { Task } from 'src/tasks/entity/task.entity';
import { TaskStatus } from 'src/tasks/entity/task-status.enum';
import { ERRORS } from '../common/constants/error-messages.constant';

@Injectable()
export class ReportTypesService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(ReportType)
    private readonly reportTypeRepository: Repository<ReportType>,

    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly reportTypeUtils: ReportTypeUtils,
    private readonly cronUtil: CronUtil,
  ) {
    this.logger = new Logger(ReportTypesService.name);
  }

  public fetchAllAsync = async (): Promise<ReportTypeDto[]> => {
    try {
      const reportTypes: ReportType[] = await this.reportTypeRepository.find();
      const ReportTypeDtos: ReportTypeDto[] = [];
      reportTypes.forEach((reportType: ReportType) =>
        ReportTypeDtos.push(this.reportTypeUtils.convertToDto(reportType)),
      );
      return ReportTypeDtos;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public fetchOneAsync = async (id: number): Promise<ReportTypeDto> => {
    try {
      const reportType: ReportType = await this.reportTypeRepository.findOneBy({
        id,
      });
      return this.reportTypeUtils.convertToDto(reportType);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public createAsync = async (
    createReportTypeRequestDto: CreateReportTypeRequestDto,
  ): Promise<ReportTypeDto> => {
    try {
      // check if the report type already exists
      const exists = await this.reportTypeRepository.findOneBy({
        name: createReportTypeRequestDto.name,
      });

      if (exists) {
        throw new ConflictException(ERRORS.REPORT_TYPE_ALREADY_EXISTS);
      }

      const reportType = this.reportTypeRepository.create({
        name: createReportTypeRequestDto.name,
        datetime: createReportTypeRequestDto.datetime,
        emails: createReportTypeRequestDto.emails.join(','),
        frequency: createReportTypeRequestDto.frequency,
        outputType: createReportTypeRequestDto.outputType,
      });

      const savedReportType = await this.reportTypeRepository.save(reportType);
      return this.reportTypeUtils.convertToDto(savedReportType);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public updateAsync = async (
    id: number,
    updateReportTypeRequestDto: UpdateReportTypeRequestDto,
  ): Promise<ReportTypeDto> => {
    try {
      // fetch the report type
      const reportType = await this.reportTypeRepository.findOne({
        where: { id },
        relations: { reports: { task: true } },
      });

      if (!reportType) {
        throw new NotFoundException(ERRORS.REPORT_TYPE_NOT_FOUND);
      }

      if (updateReportTypeRequestDto.emails?.length) {
        reportType.emails = updateReportTypeRequestDto.emails.join(',');
      }

      if (updateReportTypeRequestDto.name) {
        reportType.name = updateReportTypeRequestDto.name;
      }

      if (updateReportTypeRequestDto.frequency) {
        reportType.frequency = updateReportTypeRequestDto.frequency;
      }

      const tasksToUpdate: Array<Task> = [];

      if (updateReportTypeRequestDto.datetime) {
        reportType.datetime = updateReportTypeRequestDto.datetime;

        reportType.reports.forEach((report) => {
          if (report.task) {
            report.task.cronExpression = this.cronUtil.dateToCron(
              reportType.datetime,
              reportType.frequency,
            );
            report.task.status = TaskStatus.SCHEDULED; // changed the status to scheduled
            tasksToUpdate.push(report.task);
          }
        });
      }

      if (updateReportTypeRequestDto.outputType) {
        reportType.outputType = updateReportTypeRequestDto.outputType;
      }

      const updatedReportType =
        await this.reportTypeRepository.save(reportType);

      if (tasksToUpdate.length > 0) {
        await this.taskRepository.save(tasksToUpdate);
      }

      return this.reportTypeUtils.convertToDto(updatedReportType);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public deleteAsync = async (id: number): Promise<boolean> => {
    try {
      const reportType = await this.reportTypeRepository.findOne({
        where: { id },
        relations: { reports: { task: true } },
      });

      if (!reportType) return false;

      for (const report of reportType.reports || []) {
        if (report.task) {
          await this.taskRepository.delete(report.task.id);
        }
      }

      const reportIds = (reportType.reports || []).map((r) => r.id);
      if (reportIds.length > 0) {
        await this.reportTypeRepository.manager
          .getRepository('Report')
          .delete(reportIds);
      }

      const removed = await this.reportTypeRepository.delete({ id });
      return removed.affected > 0;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };
}
