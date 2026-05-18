import { Test, TestingModule } from '@nestjs/testing';
import { ReportDetailUtil } from './report-details.utils';
import { ReportDetail } from '../entity/report-detail.entity';

describe('ReportDetailUtil', () => {
  let reportDetailUtil: ReportDetailUtil;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportDetailUtil],
    }).compile();

    reportDetailUtil = module.get<ReportDetailUtil>(ReportDetailUtil);
  });

  const createMockReportDetail = (
    overrides: Partial<ReportDetail> = {},
  ): ReportDetail => {
    const detail = new ReportDetail();
    Object.assign(detail, {
      id: 1,
      tableName: 'users',
      fieldName: 'email',
      dataType: 'varchar',
      ...overrides,
    });
    return detail;
  };

  it('should convert ReportDetail to ReportDetailDto', () => {
    const detail = createMockReportDetail();
    const result = reportDetailUtil.convertToDto(detail);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.tableName).toBe('users');
    expect(result.fieldName).toBe('email');
    expect(result.dataType).toBe('varchar');
  });

  it('should return undefined when reportDetail is undefined', () => {
    const result = reportDetailUtil.convertToDto(undefined);
    expect(result).toBeUndefined();
  });

  it('should handle optional fields being undefined', () => {
    const detail = createMockReportDetail({
      tableName: undefined,
      fieldName: undefined,
      dataType: undefined,
    });

    const result = reportDetailUtil.convertToDto(detail);

    expect(result.id).toBe(1);
    expect(result.tableName).toBeUndefined();
    expect(result.fieldName).toBeUndefined();
    expect(result.dataType).toBeUndefined();
  });

  it('should convert with minimal fields', () => {
    const detail = createMockReportDetail({
      id: 99,
      tableName: 'orders',
      fieldName: 'total',
      dataType: 'decimal',
    });

    const result = reportDetailUtil.convertToDto(detail);

    expect(result.id).toBe(99);
    expect(result.tableName).toBe('orders');
    expect(result.fieldName).toBe('total');
    expect(result.dataType).toBe('decimal');
  });
});
