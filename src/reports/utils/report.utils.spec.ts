import { Test, TestingModule } from '@nestjs/testing';
import { ReportUtils } from './report.utils';
import { ConnectionUtils } from 'src/connections/utils/connection.utils';
import { ReportTypeUtils } from 'src/report-types/utils/report-type.utils';
import { ReportDetailUtil } from './report-details.utils';
import { Report } from '../entity/report.entity';
import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { ReportDetail } from '../entity/report-detail.entity';
import { DatabaseType } from 'src/connections/databasetype.enum';
import { Frequency } from 'src/report-types/entity/frequency.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';

describe('ReportUtils', () => {
  let reportUtils: ReportUtils;
  let connectionUtils: ConnectionUtils;
  let reportTypeUtils: ReportTypeUtils;
  let reportDetailUtil: ReportDetailUtil;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportUtils,
        {
          provide: ConnectionUtils,
          useValue: {
            convertToDto: jest.fn(),
          },
        },
        {
          provide: ReportTypeUtils,
          useValue: {
            convertToDto: jest.fn(),
          },
        },
        {
          provide: ReportDetailUtil,
          useValue: {
            convertToDto: jest.fn(),
          },
        },
      ],
    }).compile();

    reportUtils = module.get<ReportUtils>(ReportUtils);
    connectionUtils = module.get<ConnectionUtils>(ConnectionUtils);
    reportTypeUtils = module.get<ReportTypeUtils>(ReportTypeUtils);
    reportDetailUtil = module.get<ReportDetailUtil>(ReportDetailUtil);
  });

  const createMockReport = (overrides: Partial<Report> = {}): Report => {
    const report = new Report();
    Object.assign(report, {
      id: 1,
      name: 'Test Report',
      description: 'A test report',
      queryString: 'SELECT * FROM users',
      connection: { id: 1 } as Connection,
      reportType: { id: 1 } as ReportType,
      reportDetails: [],
      ...overrides,
    });
    return report;
  };

  it('should convert Report to ReportDto', () => {
    const mockConnectionDto = {
      id: 1,
      name: 'conn',
      database: 'db',
      databaseType: DatabaseType.MSSQL,
    } as any;
    const mockReportTypeDto = {
      id: 1,
      name: 'daily',
      frequency: Frequency.DAILY,
      outputType: OutputFormat.CSV,
    } as any;
    const mockReportDetailDto = {
      id: 1,
      tableName: 'users',
      fieldName: 'email',
      dataType: 'varchar',
    };

    jest
      .spyOn(connectionUtils, 'convertToDto')
      .mockReturnValue(mockConnectionDto);
    jest
      .spyOn(reportTypeUtils, 'convertToDto')
      .mockReturnValue(mockReportTypeDto);
    jest
      .spyOn(reportDetailUtil, 'convertToDto')
      .mockReturnValue(mockReportDetailDto);

    const detail = new ReportDetail();
    Object.assign(detail, {
      id: 1,
      tableName: 'users',
      fieldName: 'email',
      dataType: 'varchar',
    });

    const report = createMockReport({ reportDetails: [detail] });
    const result = reportUtils.convertToDto(report);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test Report');
    expect(result.description).toBe('A test report');
    expect(result.queryString).toBe('SELECT * FROM users');
    expect(result.connectionId).toBe(1);
    expect(result.connection).toEqual(mockConnectionDto);
    expect(result.reportTypeId).toBe(1);
    expect(result.reportType).toEqual(mockReportTypeDto);
    expect(result.reportDetails).toHaveLength(1);
    expect(result.reportDetails[0]).toEqual(mockReportDetailDto);

    expect(connectionUtils.convertToDto).toHaveBeenCalledWith(
      report.connection,
    );
    expect(reportTypeUtils.convertToDto).toHaveBeenCalledWith(
      report.reportType,
    );
    expect(reportDetailUtil.convertToDto).toHaveBeenCalledWith(detail);
  });

  it('should return undefined when report is falsy', () => {
    const result = reportUtils.convertToDto(null);
    expect(result).toBeUndefined();
  });

  it('should return undefined when report is undefined', () => {
    const result = reportUtils.convertToDto(undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when connectionUtils.convertToDto throws', () => {
    jest.spyOn(connectionUtils, 'convertToDto').mockImplementation(() => {
      throw new Error('connection error');
    });

    const report = createMockReport();
    const result = reportUtils.convertToDto(report);

    expect(result).toBeUndefined();
  });

  it('should handle report with no reportDetails', () => {
    jest.spyOn(connectionUtils, 'convertToDto').mockReturnValue({} as any);
    jest.spyOn(reportTypeUtils, 'convertToDto').mockReturnValue({} as any);

    const report = createMockReport({ reportDetails: undefined });
    const result = reportUtils.convertToDto(report);

    expect(result).toBeDefined();
    expect(result.reportDetails).toEqual([]);
  });

  it('should handle report with null connection', () => {
    jest.spyOn(connectionUtils, 'convertToDto').mockReturnValue(undefined);
    jest.spyOn(reportTypeUtils, 'convertToDto').mockReturnValue({} as any);
    jest.spyOn(reportDetailUtil, 'convertToDto').mockReturnValue({} as any);

    const report = createMockReport({ connection: undefined });
    const result = reportUtils.convertToDto(report);

    expect(result).toBeDefined();
    expect(result.connectionId).toBeUndefined();
    expect(result.connection).toBeUndefined();
  });

  it('should handle report with null reportType', () => {
    jest.spyOn(connectionUtils, 'convertToDto').mockReturnValue({} as any);
    jest.spyOn(reportTypeUtils, 'convertToDto').mockReturnValue(undefined);

    const report = createMockReport({ reportType: undefined });
    const result = reportUtils.convertToDto(report);

    expect(result).toBeDefined();
    expect(result.reportTypeId).toBeUndefined();
    expect(result.reportType).toBeUndefined();
  });
});
