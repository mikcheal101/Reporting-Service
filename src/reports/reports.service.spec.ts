import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entity/report.entity';
import { QueryParameter } from './entity/query-parameter.entity';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { DatabaseUtils } from 'src/common/utils/database.utils';
import { ReportUtils } from './utils/report.utils';
import { CreateReportRequestDto } from './dto/create-report.request.dto';
import { UpdateReportRequestDto } from './dto/update-report.request.dto';
import { QueryRequestDto } from './dto/query.request.dto';
import { AiQueryGenerationRequestDto } from './dto/ai-query-generation.request.dto';
import { ReportDto } from './dto/report.dto';
import { DatabaseFactory } from 'src/connections/database.factory';
import { DatabaseType } from 'src/connections/databasetype.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';
import { Frequency } from 'src/report-types/entity/frequency.enum';
import { QueryCacheService } from 'src/common/cache/query-cache.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: Repository<Report>;
  let queryParameterRepository: Repository<QueryParameter>;
  let cryptoService: CryptoService;
  let databaseUtils: DatabaseUtils;
  let reportUtils: ReportUtils;

  const mockReport = {
    id: 1,
    name: 'Test Report',
    description: 'A test report',
    connection: {
      id: 1,
      name: 'Test Connection',
      password: 'encrypted',
      database: 'testdb',
      databaseType: DatabaseType.MSSQL,
      server: 'localhost',
      port: 1433,
      user: 'sa',
      isTestSuccessful: true,
      reports: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    reportType: {
      id: 1,
      name: 'Daily',
      outputType: OutputFormat.PDF,
      frequency: Frequency.DAILY,
      runDate: '2025-01-01',
      runTime: '10:00',
      emailsToNotify: 'test@test.com',
    },
    reportDetails: [],
    queryString: 'SELECT * FROM users',
    parameters: [],
    task: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    queryString: 'SELECT * FROM users',
  };

  const mockQueryParameter = {
    id: 1,
    name: 'param1',
    value: 'value1',
    dataType: 'string',
    report: { id: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReportRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockQueryParameterRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockCryptoService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockDatabaseUtils = {
    mapDbParameters: jest.fn(),
  };

  const mockReportUtils = {
    convertToDto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Report),
          useValue: mockReportRepository,
        },
        {
          provide: getRepositoryToken(QueryParameter),
          useValue: mockQueryParameterRepository,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: DatabaseUtils,
          useValue: mockDatabaseUtils,
        },
        {
          provide: ReportUtils,
          useValue: mockReportUtils,
        },
        {
          provide: QueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            buildKey: jest.fn(),
            getStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    reportRepository = module.get(getRepositoryToken(Report));
    queryParameterRepository = module.get(getRepositoryToken(QueryParameter));
    cryptoService = module.get<CryptoService>(CryptoService);
    databaseUtils = module.get<DatabaseUtils>(DatabaseUtils);
    reportUtils = module.get<ReportUtils>(ReportUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReportAsync', () => {
    const createDto: CreateReportRequestDto = {
      name: 'New Report',
      description: 'A new report',
      connectionId: 1,
      reportTypeId: 1,
    };

    it('should create a new report', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(null);
      mockReportRepository.create.mockReturnValue(mockReport);
      mockReportRepository.save.mockResolvedValue(mockReport);
      mockReportUtils.convertToDto.mockReturnValue(mockReportDto);

      const result = await service.createReportAsync(createDto);

      expect(result).toEqual(mockReportDto);
    });

    it('should return existing report if name already exists', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(mockReport);
      mockReportUtils.convertToDto.mockReturnValue(mockReportDto);

      const result = await service.createReportAsync(createDto);

      expect(result).toEqual(mockReportDto);
      expect(mockReportRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      mockReportRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      await expect(service.createReportAsync(createDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('fetchAllAsync', () => {
    it('should return all reports', async () => {
      mockReportRepository.find.mockResolvedValue([mockReport]);
      mockReportUtils.convertToDto.mockReturnValue(mockReportDto);

      const result = await service.fetchAllAsync();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockReportDto);
    });

    it('should return empty array when no reports', async () => {
      mockReportRepository.find.mockResolvedValue([]);

      const result = await service.fetchAllAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockReportRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.fetchAllAsync()).rejects.toThrow('DB error');
    });
  });

  describe('findOneAsync', () => {
    it('should find a report by id', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockReportUtils.convertToDto.mockReturnValue(mockReportDto);

      const result = await service.findOneAsync(1);

      expect(result).toEqual(mockReportDto);
      expect(mockReportRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { connection: true, reportType: true, reportDetails: true },
      });
    });

    it('should handle null report gracefully', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);
      mockReportUtils.convertToDto.mockReturnValue(null as any);

      const result = await service.findOneAsync(999);

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockReportRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findOneAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('deleteAsync', () => {
    it('should delete a report', async () => {
      mockReportRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.deleteAsync(1);

      expect(result).toBe(true);
      expect(mockReportRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should propagate errors', async () => {
      mockReportRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('updateAsync', () => {
    const updateDto: UpdateReportRequestDto = {
      name: 'Updated Report',
      description: 'Updated description',
      connectionId: 1,
      reportTypeId: 1,
    };

    it('should update a report', async () => {
      const updatedReport = { ...mockReport, name: 'Updated Report' };
      mockReportRepository.findOneBy.mockResolvedValue(mockReport);
      mockReportRepository.save.mockResolvedValue(updatedReport);
      mockReportUtils.convertToDto.mockReturnValue({
        ...mockReportDto,
        name: 'Updated Report',
      });

      const result = await service.updateAsync(1, updateDto);

      expect(result).toBeDefined();
    });

    it('should throw when report not found', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(null);

      await expect(service.updateAsync(999, updateDto)).rejects.toThrow(
        'Report not found',
      );
    });

    it('should propagate errors', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(mockReport);
      mockReportRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(service.updateAsync(1, updateDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getReportParametersAsync', () => {
    it('should return query parameters for a report', async () => {
      mockQueryParameterRepository.findBy.mockResolvedValue([
        mockQueryParameter,
      ]);

      const result = await service.getReportParametersAsync(1);

      expect(result).toHaveLength(1);
      expect(mockQueryParameterRepository.findBy).toHaveBeenCalledWith({
        report: { id: 1 },
      });
    });

    it('should return empty array when no parameters', async () => {
      mockQueryParameterRepository.findBy.mockResolvedValue([]);

      const result = await service.getReportParametersAsync(1);

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockQueryParameterRepository.findBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getReportParametersAsync(1)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('testQueryAsync', () => {
    const queryDto: QueryRequestDto = {
      reportId: '1',
      queryString: 'SELECT * FROM users WHERE id = @id',
      parameters: [{ name: 'id', value: '1', dataType: 'int' }],
      computedColumns: [],
      filters: [],
      isFromQueryBuilder: false,
      joins: [],
      limit: 100,
    };

    it('should test a query successfully', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');
      mockDatabaseUtils.mapDbParameters.mockReturnValue({ id: '1' });

      const mockAdapter = {
        connectAsync: jest.fn().mockResolvedValue(undefined),
        queryAsync: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);

      const result = await service.testQueryAsync(queryDto);

      expect(result).toBe('[{"id":1,"name":"Test"}]');
    });

    it('should throw when report not found', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(service.testQueryAsync(queryDto)).rejects.toThrow(
        'Report not found',
      );
    });

    it('should propagate adapter errors', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockReport);
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');

      const mockAdapter = {
        connectAsync: jest.fn().mockRejectedValue(new Error('Query failed')),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);

      await expect(service.testQueryAsync(queryDto)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('saveQueryAsync', () => {
    const queryDto: QueryRequestDto = {
      reportId: '1',
      queryString: 'SELECT * FROM users',
      parameters: [{ name: 'id', value: '1', dataType: 'int' }],
      computedColumns: [],
      filters: [],
      isFromQueryBuilder: false,
      joins: [],
      limit: 100,
    };

    it('should save query and parameters', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(mockReport);
      mockReportRepository.save.mockResolvedValue(mockReport);
      mockQueryParameterRepository.create.mockReturnValue(mockQueryParameter);
      mockQueryParameterRepository.save.mockResolvedValue([mockQueryParameter]);

      const result = await service.saveQueryAsync(queryDto);

      expect(result).toBe(true);
    });

    it('should throw when report not found', async () => {
      mockReportRepository.findOneBy.mockResolvedValue(null);

      await expect(service.saveQueryAsync(queryDto)).rejects.toThrow(
        'Report not found',
      );
    });

    it('should handle existing parameters by removing them first', async () => {
      const reportWithParams = {
        ...mockReport,
        parameters: [mockQueryParameter],
      };
      mockReportRepository.findOneBy.mockResolvedValue(reportWithParams);
      mockReportRepository.save.mockResolvedValue(reportWithParams);
      mockQueryParameterRepository.remove.mockResolvedValue(undefined);
      mockQueryParameterRepository.create.mockReturnValue(mockQueryParameter);
      mockQueryParameterRepository.save.mockResolvedValue([mockQueryParameter]);

      const result = await service.saveQueryAsync(queryDto);

      expect(result).toBe(true);
      expect(mockQueryParameterRepository.remove).toHaveBeenCalledWith([
        mockQueryParameter,
      ]);
    });

    it('should propagate errors', async () => {
      mockReportRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      await expect(service.saveQueryAsync(queryDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('generateQueryViaAIAsync', () => {
    const aiDto: AiQueryGenerationRequestDto = {
      reportId: 1,
      prompt: 'Show all users',
      schemas: [{ table: 'users', columns: 'id, name, email' }],
    };

    beforeEach(() => {
      jest
        .spyOn(DatabaseFactory, 'deriveDatabaseName')
        .mockReturnValue('MSSQL');
    });

    it('should generate a query via AI', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockReport);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ response: 'SELECT * FROM users' }),
      });

      const result = await service.generateQueryViaAIAsync(aiDto);

      expect(result).toBe('SELECT * FROM users');
    });

    it('should throw when AI response is not ok', async () => {
      mockReportRepository.findOne.mockResolvedValue(mockReport);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      });

      await expect(service.generateQueryViaAIAsync(aiDto)).rejects.toThrow(
        'AI query generation failed',
      );
    });

    it('should throw when report not found', async () => {
      mockReportRepository.findOne.mockResolvedValue(null);

      await expect(service.generateQueryViaAIAsync(aiDto)).rejects.toThrow(
        'No report found for this query',
      );
    });

    it('should throw when report has no connection', async () => {
      mockReportRepository.findOne.mockResolvedValue({
        ...mockReport,
        connection: null,
      });

      await expect(service.generateQueryViaAIAsync(aiDto)).rejects.toThrow(
        'No connection defined for the report found for this query',
      );
    });
  });
});
