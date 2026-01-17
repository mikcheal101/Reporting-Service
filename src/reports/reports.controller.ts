import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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

@Controller('/api/v1/reports')
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
      throw new BadGatewayException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getReports(): Promise<ReportDto[]> {
    try {
      return await this.reportsService.fetchAllAsync();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('test-query')
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
      return response.status(HttpStatus.BAD_REQUEST).json(error?.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('save-query')
  public async saveQuery(
    @Body() queryRequestDto: QueryRequestDto,
  ): Promise<boolean> {
    try {
      return await this.reportsService.saveQueryAsync(queryRequestDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('ai-generate-query')
  public async generateQueryViaAI(
    @Body() aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
  ): Promise<string | undefined> {
    try {
      return await this.reportsService.generateQueryViaAIAsync(
        aiQueryGenerationRequestDto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('report-parameters/:id')
  public async getReportParameters(@Param('id') id: string): Promise<any> {
    try {
      return this.reportsService.getReportParametersAsync(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  public async getReport(@Param('id') id: string): Promise<ReportDto> {
    try {
      return await this.reportsService.findOneAsync(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
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
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  public async deleteReport(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.reportsService.deleteAsync(Number.parseInt(id));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
