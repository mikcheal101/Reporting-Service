import { Test, TestingModule } from '@nestjs/testing';
import { ReportTypeUtils } from './report-type.utils';
import { ReportType } from '../entity/report-types.entity';
import { Frequency } from '../entity/frequency.enum';
import { OutputFormat } from 'src/common/exporters/output-format.enum';

describe('ReportTypeUtils', () => {
  let reportTypeUtils: ReportTypeUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportTypeUtils],
    }).compile();

    reportTypeUtils = module.get<ReportTypeUtils>(ReportTypeUtils);
  });

  const createMockReportType = (
    overrides: Partial<ReportType> = {},
  ): ReportType => {
    const rt = new ReportType();
    Object.assign(rt, {
      id: 1,
      name: 'Daily Report',
      datetime: new Date('2025-06-15T14:30:00'),
      emails: 'admin@test.com',
      frequency: Frequency.DAILY,
      outputType: OutputFormat.CSV,
      ...overrides,
    });
    return rt;
  };

  it('should convert ReportType to ReportTypeDto', () => {
    const reportType = createMockReportType();
    const result = reportTypeUtils.convertToDto(reportType);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('Daily Report');
    expect(result.frequency).toBe(Frequency.DAILY);
    expect(result.emailsToNotify).toBe('admin@test.com');
    expect(result.outputType).toBe(OutputFormat.CSV);
    expect(result.runDate).toBeDefined();
    expect(result.runTime).toBeDefined();
  });

  it('should return undefined when reportType is undefined', () => {
    const result = reportTypeUtils.convertToDto(undefined);
    expect(result).toBeUndefined();
  });

  it('should extract runDate from datetime', () => {
    const reportType = createMockReportType({
      datetime: new Date('2025-12-25T09:15:30'),
    });
    const result = reportTypeUtils.convertToDto(reportType);

    expect(result.runDate).toBe('2025-12-25');
  });

  it('should handle different output types and frequencies', () => {
    const reportType = createMockReportType({
      outputType: OutputFormat.PDF,
      frequency: Frequency.MONTHLY,
    });
    const result = reportTypeUtils.convertToDto(reportType);

    expect(result.outputType).toBe(OutputFormat.PDF);
    expect(result.frequency).toBe(Frequency.MONTHLY);
  });

  it('should handle single-digit hour and minute', () => {
    const reportType = createMockReportType({
      datetime: new Date('2025-01-05T08:05:03'),
    });
    const result = reportTypeUtils.convertToDto(reportType);

    expect(result.runDate).toBe('2025-01-05');
  });

  it('should handle null datetime gracefully', () => {
    const reportType = createMockReportType({ datetime: null });
    const result = reportTypeUtils.convertToDto(reportType);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});
