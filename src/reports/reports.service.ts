import { Injectable, Logger } from '@nestjs/common';
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
  ) {
    this.logger = new Logger(ReportsService.name);
  }

  public createReportAsync = async (
    createReportRequestDto: CreateReportRequestDto,
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
      });

      const createdReport = await this.reportRepository.save(report);
      return this.reportUtils.convertToDto(createdReport);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public fetchAllAsync = async (): Promise<ReportDto[]> => {
    try {
      const reports = await this.reportRepository.find();
      const reportDtos: ReportDto[] = [];
      reports.forEach((report) => {
        reportDtos.push(this.reportUtils.convertToDto(report));
      });
      return reportDtos;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public findOneAsync = async (id: number): Promise<ReportDto> => {
    try {
      const report = await this.reportRepository.findOne({
        where: { id },
        relations: {
          connection: true,
          reportType: true,
          reportDetails: true,
        },
      });
      return this.reportUtils.convertToDto(report);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public deleteAsync = async (id: number): Promise<boolean> => {
    try {
      await this.reportRepository.delete(id);
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public updateAsync = async (
    id: number,
    updateReportRequestDto: UpdateReportRequestDto,
  ): Promise<ReportDto> => {
    try {
      // get the report to update
      const previous = await this.reportRepository.findOneBy({ id });
      if (!previous) throw new Error('Invalid Report ID!');

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
      throw new Error(error.message);
    }
  };

  public getReportParametersAsync = async (
    id: number,
  ): Promise<QueryParameter[]> => {
    try {
      // get the parameters by Report
      return await this.queryParameterRepository.findBy({
        report: { id },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public testQueryAsync = async (
    queryRequestDto: QueryRequestDto,
  ): Promise<string | undefined> => {
    // get the report
    const report = await this.reportRepository.findOne({
      where: { id: Number.parseInt(queryRequestDto.reportId) },
      relations: {
        connection: true,
      },
    });

    if (!report) throw new Error('Report not found!');

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
      const response = await adapter.queryAsync(
        queryRequestDto.queryString,
        parameters,
      );
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
  ): Promise<boolean> => {
    try {
      // get the report
      const report = await this.reportRepository.findOneBy({
        id: Number.parseInt(queryRequestDto.reportId),
      });

      if (!report) throw new Error('Report not found!');

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
      throw new Error(error.message);
    }
  };

  public generateQueryViaAIAsync = async (
    aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
  ): Promise<string> => {
    try {
      // get the query
      const aiPrompt = await this.generateAiPromptAsync(
        aiQueryGenerationRequestDto,
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
        throw new Error('Failed to generate query via AI!');
      }

      const data = await ollamaResponse.json();
      const apiResponse = data.response?.trim();

      return apiResponse;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  private readonly generateAiPromptAsync = async (
    aiQueryGenerationRequestDto: AiQueryGenerationRequestDto,
  ): Promise<string> => {
    try {
      // fetch the report to get the databasetype
      const report = await this.reportRepository.findOne({
        where: { id: aiQueryGenerationRequestDto.reportId },
        relations: {
          connection: true,
        },
      });

      if (!report) throw new Error('No report found for this query!');
      if (!report.connection) {
        throw new Error(
          'No connection defined for the report found for this query!',
        );
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
      throw new Error(error.message);
    }
  };
}
