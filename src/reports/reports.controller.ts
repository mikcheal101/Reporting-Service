import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportRequestDto } from './dto/create-report.request.dto';
import { UpdateReportRequestDto } from './dto/update-report.request.dto';
import { ReportDto } from './dto/report.dto';
import { QueryRequestDto } from './dto/query.request.dto';
import { AiQueryGenerationRequestDto } from './dto/ai-query-generation.request.dto';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { Response } from 'express';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.REPORTS)
export class ReportsController {
  private readonly logger: Logger;

  constructor(private readonly reportsService: ReportsService) {
    this.logger = new Logger(ReportsController.name);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async saveReport(
    @Body() createReportRequestDto: CreateReportRequestDto,
  ): Promise<ReportDto> {
    try {
      return await this.reportsService.createReportAsync(
        createReportRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadGatewayException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getReports(): Promise<ReportDto[]> {
    try {
      return await this.reportsService.fetchAllAsync();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Post(ROUTE_PATHS.TEST_QUERY)
  public async testQuery(
    @Body() queryRequestDto: QueryRequestDto,
    @Res() response: Response,
  ): Promise<Response> {
    try {
      const result: string =
        await this.reportsService.testQueryAsync(queryRequestDto);
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (
        error instanceof DatabaseTimeOutError ||
        error instanceof DatabaseDeadLockError
      ) {
        return response.status(HttpStatus.ACCEPTED).json(error?.message);
      }
      if (error instanceof HttpException) throw error;
      return response.status(HttpStatus.BAD_REQUEST).json(error?.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(ROUTE_PATHS.SAVE_QUERY)
  public async saveQuery(
    @Body() queryRequestDto: QueryRequestDto,
  ): Promise<boolean> {
    try {
      return await this.reportsService.saveQueryAsync(queryRequestDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.AI_GENERATE_QUERY)
  public async generateQueryViaAI(
    @Body() aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
  ): Promise<string | undefined> {
    try {
      return await this.reportsService.generateQueryViaAIAsync(
        aiQueryGenerationRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.REPORT_PARAMETERS)
  public async getReportParameters(@Param('id') id: string): Promise<any> {
    try {
      return this.reportsService.getReportParametersAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.ID)
  public async getReport(@Param('id') id: string): Promise<ReportDto> {
    try {
      return await this.reportsService.findOneAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(ROUTE_PATHS.ID)
  public async updateReport(
    @Param('id') id: string,
    @Body() updateReportRequestDto: UpdateReportRequestDto,
  ): Promise<ReportDto> {
    try {
      return await this.reportsService.updateAsync(
        Number.parseInt(id),
        updateReportRequestDto,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(ROUTE_PATHS.ID)
  public async deleteReport(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.reportsService.deleteAsync(Number.parseInt(id));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
