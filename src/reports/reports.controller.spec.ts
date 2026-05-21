import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CreateReportRequestDto } from './dto/create-report.request.dto';
import { UpdateReportRequestDto } from './dto/update-report.request.dto';
import { QueryRequestDto } from './dto/query.request.dto';
import { AiQueryGenerationRequestDto } from './dto/ai-query-generation.request.dto';
import { ReportDto } from './dto/report.dto';
import { DatabaseType } from 'src/connections/databasetype.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';
import { Frequency } from 'src/report-types/entity/frequency.enum';
import { AuthGuard } from 'src/auth/guard/auth.guard';

const mockRequest = { user: { id: 1 } } as any;

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportsService: ReportsService;

  const mockFullConnectionDto = {
    id: 1,
    name: 'Test Connection',
    server: 'localhost',
    port: 1433,
    user: 'sa',
    password: 'password',
    database: 'testdb',
    databaseType: DatabaseType.MSSQL,
    isTestSuccessful: true,
    queryTimeout: 60,
    cacheEnabled: false,
    cacheTtl: 300,
    streamEnabled: false,
  };

  const mockFullReportTypeDto = {
    id: 1,
    name: 'Daily',
    outputType: OutputFormat.PDF,
    frequency: Frequency.DAILY,
    runDate: '2025-01-01',
    runTime: '10:00',
    emailsToNotify: 'test@test.com',
  };

  const mockReportDto: ReportDto = {
    id: 1,
    name: 'Test Report',
    description: 'A test report',
    connectionId: 1,
    connection: mockFullConnectionDto,
    reportTypeId: 1,
    reportType: mockFullReportTypeDto,
    reportDetails: [],
    queryString: null,
  };

  const mockReportsService = {
    createReportAsync: jest.fn(),
    fetchAllAsync: jest.fn(),
    findOneAsync: jest.fn(),
    updateAsync: jest.fn(),
    deleteAsync: jest.fn(),
    getReportParametersAsync: jest.fn(),
    testQueryAsync: jest.fn(),
    saveQueryAsync: jest.fn(),
    generateQueryViaAIAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
      ],
    }).overrideGuard(AuthGuard).useValue({ canActivate: jest.fn(() => true) }).compile();

    controller = module.get<ReportsController>(ReportsController);
    reportsService = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('saveReport', () => {
    const createDto: CreateReportRequestDto = {
      name: 'New Report',
      description: 'A new report',
      connectionId: 1,
      reportTypeId: 1,
    };

    it('should create a report', async () => {
      mockReportsService.createReportAsync.mockResolvedValue(mockReportDto);

      const result = await controller.saveReport(createDto, mockRequest);

      expect(result).toEqual(mockReportDto);
    });

    it('should throw BadGatewayException on error', async () => {
      mockReportsService.createReportAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.saveReport(createDto, mockRequest)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('getReports', () => {
    it('should return all reports', async () => {
      mockReportsService.fetchAllAsync.mockResolvedValue([mockReportDto]);

      const result = await controller.getReports(mockRequest);

      expect(result).toEqual([mockReportDto]);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.fetchAllAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.getReports(mockRequest)).rejects.toThrow('Fetch failed');
    });
  });

  describe('testQuery', () => {
    const queryDto: QueryRequestDto = {
      reportId: '1',
      queryString: 'SELECT 1',
      parameters: [],
      computedColumns: [],
      filters: [],
      isFromQueryBuilder: false,
      joins: [],
      limit: 100,
    };

    it('should test a query', async () => {
      mockReportsService.testQueryAsync.mockResolvedValue('[{"id":1}]');

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any;

      await controller.testQuery(queryDto, mockRequest, mockResponse);

      expect(mockReportsService.testQueryAsync).toHaveBeenCalledWith(queryDto, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('saveQuery', () => {
    const queryDto: QueryRequestDto = {
      reportId: '1',
      queryString: 'SELECT 1',
      parameters: [],
      computedColumns: [],
      filters: [],
      isFromQueryBuilder: false,
      joins: [],
      limit: 100,
    };

    it('should save a query', async () => {
      mockReportsService.saveQueryAsync.mockResolvedValue(true);

      const result = await controller.saveQuery(queryDto, mockRequest);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.saveQueryAsync.mockRejectedValue(
        new Error('Save failed'),
      );

      await expect(controller.saveQuery(queryDto, mockRequest)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('generateQueryViaAI', () => {
    const aiDto: AiQueryGenerationRequestDto = {
      reportId: 1,
      prompt: 'Show users',
      schemas: [{ table: 'users', columns: 'id, name' }],
    };

    it('should generate a query via AI', async () => {
      mockReportsService.generateQueryViaAIAsync.mockResolvedValue(
        'SELECT * FROM users',
      );

      const result = await controller.generateQueryViaAI(aiDto, mockRequest);

      expect(result).toBe('SELECT * FROM users');
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.generateQueryViaAIAsync.mockRejectedValue(
        new Error('AI failed'),
      );

      await expect(controller.generateQueryViaAI(aiDto, mockRequest)).rejects.toThrow(
        'AI failed',
      );
    });
  });

  describe('getReportParameters', () => {
    it('should return report parameters', async () => {
      mockReportsService.getReportParametersAsync.mockResolvedValue([
        { id: 1, name: 'param1', value: 'val1', dataType: 'string' },
      ]);

      const result = await controller.getReportParameters('1', mockRequest);

      expect(result).toEqual([
        { id: 1, name: 'param1', value: 'val1', dataType: 'string' },
      ]);
      expect(mockReportsService.getReportParametersAsync).toHaveBeenCalledWith(
        1,
        1,
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.getReportParametersAsync.mockRejectedValue(
        new Error('Failed'),
      );

      await expect(controller.getReportParameters('1', mockRequest)).rejects.toThrow(
        'Failed',
      );
    });
  });

  describe('getReport', () => {
    it('should return a report by id', async () => {
      mockReportsService.findOneAsync.mockResolvedValue(mockReportDto);

      const result = await controller.getReport('1', mockRequest);

      expect(result).toEqual(mockReportDto);
      expect(mockReportsService.findOneAsync).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.findOneAsync.mockRejectedValue(new Error('Not found'));

      await expect(controller.getReport('999', mockRequest)).rejects.toThrow('Not found');
    });
  });

  describe('updateReport', () => {
    const updateDto: UpdateReportRequestDto = {
      name: 'Updated',
      connectionId: 1,
      reportTypeId: 1,
    };

    it('should update a report', async () => {
      mockReportsService.updateAsync.mockResolvedValue(mockReportDto);

      const result = await controller.updateReport('1', updateDto, mockRequest);

      expect(result).toEqual(mockReportDto);
      expect(mockReportsService.updateAsync).toHaveBeenCalledWith(1, updateDto, 1);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.updateAsync.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.updateReport('1', updateDto, mockRequest)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteReport', () => {
    it('should delete a report', async () => {
      mockReportsService.deleteAsync.mockResolvedValue(true);

      const result = await controller.deleteReport('1', mockRequest);

      expect(result).toBe(true);
      expect(mockReportsService.deleteAsync).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException on error', async () => {
      mockReportsService.deleteAsync.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteReport('1', mockRequest)).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
