import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './entity/report.entity';
import { Repository } from 'typeorm';
import { CreateReportRequestDto } from './dto/create-report.request.dto';
import { UpdateReportRequestDto } from './dto/update-report.request.dto';
import { ReportUtils } from './utils/report.utils';
import { ReportDto } from './dto/report.dto';
import { QueryRequestDto } from './dto/query.request.dto';
import { DatabaseFactory } from 'src/connections/database.factory';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { DatabaseUtils } from 'src/common/utils/database.utils';
import { QueryParameter } from './entity/query-parameter.entity';
import { AiQueryGenerationRequestDto } from './dto/ai-query-generation.request.dto';
import { IDatabaseAdapter } from 'src/connections/adapter/idatabase.adapter';
import { ERRORS } from '../common/constants/error-messages.constant';
import { QueryValidatorUtils } from '../common/utils/query-validator.utils';
import { QueryCacheService } from 'src/common/cache/query-cache.service';
import { maskSensitiveData } from 'src/common/utils/data-masking.utils';

@Injectable()
export class ReportsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(QueryParameter)
    private readonly queryParameterRepository: Repository<QueryParameter>,
    private readonly cryptoService: CryptoService,
    private readonly databaseUtils: DatabaseUtils,
    private readonly reportUtils: ReportUtils,
    private readonly queryCache: QueryCacheService,
  ) {
    this.logger = new Logger(ReportsService.name);
  }

  public createReportAsync = async (
    createReportRequestDto: CreateReportRequestDto,
    userId?: number,
  ): Promise<ReportDto> => {
    try {
      // check if report exists
      const exists = await this.reportRepository.findOneBy({
        name: createReportRequestDto.name,
      });

      if (exists) return this.reportUtils.convertToDto(exists);

      const connection: any = { id: createReportRequestDto.connectionId };
      const reportType: any = { id: createReportRequestDto.reportTypeId };

      const report = this.reportRepository.create({
        name: createReportRequestDto.name,
        description: createReportRequestDto.description,
        connection,
        reportType,
        userId,
      });

      const createdReport = await this.reportRepository.save(report);
      return this.reportUtils.convertToDto(createdReport);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public fetchAllAsync = async (userId?: number): Promise<ReportDto[]> => {
    try {
      const reports = userId
        ? await this.reportRepository.findBy({ userId })
        : await this.reportRepository.find();
      const reportDtos: ReportDto[] = [];
      reports.forEach((report) => {
        reportDtos.push(this.reportUtils.convertToDto(report));
      });
      return reportDtos;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public findOneAsync = async (
    id: number,
    userId?: number,
  ): Promise<ReportDto> => {
    try {
      const where: any = { id };
      if (userId) where.userId = userId;
      const report = await this.reportRepository.findOne({
        where,
        relations: {
          connection: true,
          reportType: true,
          reportDetails: true,
        },
      });
      return this.reportUtils.convertToDto(report);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public deleteAsync = async (
    id: number,
    userId?: number,
  ): Promise<boolean> => {
    try {
      const where: any = { id };
      if (userId) where.userId = userId;
      await this.reportRepository.delete(where);
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public updateAsync = async (
    id: number,
    updateReportRequestDto: UpdateReportRequestDto,
    userId?: number,
  ): Promise<ReportDto> => {
    try {
      // get the report to update
      const where: any = { id };
      if (userId) where.userId = userId;
      const previous = await this.reportRepository.findOneBy(where);
      if (!previous) throw new NotFoundException(ERRORS.REPORT_NOT_FOUND);

      if (updateReportRequestDto.name !== undefined) {
        previous.name = updateReportRequestDto.name;
      }

      if (updateReportRequestDto.description !== undefined) {
        previous.description = updateReportRequestDto.description;
      }

      if (updateReportRequestDto.connectionId !== undefined) {
        const connection: any = { id: updateReportRequestDto.connectionId };
        previous.connection = connection;
      }

      if (updateReportRequestDto.reportTypeId !== undefined) {
        const reportType: any = { id: updateReportRequestDto.reportTypeId };
        previous.reportType = reportType;
      }

      if (updateReportRequestDto.queryString !== undefined) {
        previous.queryString = updateReportRequestDto.queryString;
      }

      const updatedReport = await this.reportRepository.save(previous);
      return this.reportUtils.convertToDto(updatedReport);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public getReportParametersAsync = async (
    id: number,
    userId?: number,
  ): Promise<QueryParameter[]> => {
    try {
      // get the parameters by Report
      const where: any = { report: { id } };
      if (userId) where.report = { id, userId };
      return await this.queryParameterRepository.findBy(where);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public testQueryAsync = async (
    queryRequestDto: QueryRequestDto,
    userId?: number,
  ): Promise<string | undefined> => {
    // get the report
    const where: any = { id: Number.parseInt(queryRequestDto.reportId) };
    if (userId) where.userId = userId;
    const report = await this.reportRepository.findOne({
      where,
      relations: {
        connection: true,
      },
    });

    if (!report) throw new NotFoundException(ERRORS.REPORT_NOT_FOUND);

    try {
      QueryValidatorUtils.validateQuery(queryRequestDto.queryString);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const adapter: IDatabaseAdapter = DatabaseFactory.create({
      name: report.connection.name,
      database: report.connection.database,
      databaseType: report.connection.databaseType,
      port: report.connection.port,
      server: report.connection.server,
      user: report.connection.user,
      password: this.cryptoService.decrypt(report.connection.password),
    });

    const parameters = this.databaseUtils.mapDbParameters(
      queryRequestDto.parameters,
    );

    try {
      await adapter.connectAsync();
      const queryTimeout = report.connection.queryTimeout ?? 60000;

      const cacheKey = this.queryCache.buildKey(
        report.connection.id,
        queryRequestDto.queryString,
        parameters,
      );
      const cached = report.connection.cacheEnabled
        ? this.queryCache.get<any[]>(cacheKey)
        : undefined;
      if (cached) {
        return JSON.stringify(cached);
      }

      let response = await adapter.queryAsync(
        queryRequestDto.queryString,
        parameters,
        queryTimeout,
      );

      if (Array.isArray(response)) {
        response = response.slice(0, 5);
      }
      response = maskSensitiveData(response);

      if (report.connection.cacheEnabled) {
        this.queryCache.set(cacheKey, response, report.connection.cacheTtl);
      }

      return JSON.stringify(response);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    } finally {
      adapter.closeAsync();
    }
  };

  public saveQueryAsync = async (
    queryRequestDto: QueryRequestDto,
    userId?: number,
  ): Promise<boolean> => {
    try {
      // get the report
      const where: any = { id: Number.parseInt(queryRequestDto.reportId) };
      if (userId) where.userId = userId;
      const report = await this.reportRepository.findOneBy(where);

      if (!report) throw new NotFoundException(ERRORS.REPORT_NOT_FOUND);

      try {
        QueryValidatorUtils.validateQuery(queryRequestDto.queryString);
      } catch (error) {
        throw new BadRequestException(error.message);
      }

      // update the query with the new query string
      report.queryString = queryRequestDto.queryString;

      await this.reportRepository.save(report);

      if (report.parameters && report.parameters.length > 0) {
        await this.queryParameterRepository.remove(report.parameters);
      }

      const newParameters = queryRequestDto.parameters.map((parameter) => {
        return this.queryParameterRepository.create({
          name: parameter.name,
          dataType: parameter.dataType,
          value: parameter.value,
          report,
        });
      });

      this.queryParameterRepository.save(newParameters);

      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public generateQueryViaAIAsync = async (
    aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
    userId?: number,
  ): Promise<string> => {
    try {
      // get the query
      const aiPrompt = await this.generateAiPromptAsync(
        aiQueryGenerationRequestDto,
        userId,
      );

      // send the prompt to the server
      const ollamaResponse = await fetch(process.env.OLLAMA_API || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2', // or your preferred model
          prompt: aiPrompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for more consistent SQL generation
            top_p: 0.9,
          },
        }),
      });

      if (!ollamaResponse.ok) {
        throw new BadGatewayException(ERRORS.AI_QUERY_GENERATION_FAILED);
      }

      const data = await ollamaResponse.json();
      const apiResponse = data.response?.trim();

      return apiResponse;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  private readonly generateAiPromptAsync = async (
    aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
    userId?: number,
  ): Promise<string> => {
    try {
      // fetch the report to get the databasetype
      const where: any = { id: aiQueryGenerationRequestDto.reportId };
      if (userId) where.userId = userId;
      const report = await this.reportRepository.findOne({
        where,
        relations: {
          connection: true,
        },
      });

      if (!report)
        throw new NotFoundException(ERRORS.NO_REPORT_FOUND_FOR_QUERY);
      if (!report.connection) {
        throw new BadRequestException(ERRORS.NO_CONNECTION_DEFINED);
      }

      const formattedText = aiQueryGenerationRequestDto.schemas
        .map((schema) => {
          const columns = schema.columns
            .split(',')
            .map((column) => `\t\t${column.trim()}`)
            .join('\n');

          return `-\tTable: ${schema.table} (Database Type: ${DatabaseFactory.deriveDatabaseName(report.connection.databaseType)})\n\tColumns:\n${columns}`;
        })
        .join('\n\n');

      return `
        You are a world-class SQL query generator, known for producing the most optimized, performant, and readable SQL queries.
        Given a database schema and a natural language request, your task is to generate a **valid, efficient, production-ready SQL query**.

        Database Schema:
        ${formattedText}

        Rules:
        1. Generate **only** the SQL query, no explanations.
        2. Use proper ${DatabaseFactory.deriveDatabaseName(report.connection.databaseType)} syntax specific to the database type.
        3. Include appropriate WHERE clauses to minimize data scanned.
        4. Use JOINs efficiently, choosing the right join type.
        5. Include LIMIT, TOP, or equivalent clauses for large result sets.
        6. Use proper column aliases for readability and clarity.
        7. Optimize queries for performance and maintainability.
        8. Consider indexes and common patterns to make the query fast.

        User Request: ${aiQueryGenerationRequestDto.prompt}

        SQL Query:`.trim();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };
}
