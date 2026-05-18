import 'reflect-metadata';
import { ReportDetail } from './report-detail.entity';
import { Report } from './report.entity';

describe('ReportDetail Entity', () => {
  it('should create a report detail instance', () => {
    const detail = new ReportDetail();
    detail.id = 1;
    detail.tableName = 'users';
    detail.fieldName = 'email';
    detail.dataType = 'varchar';
    expect(detail.tableName).toBe('users');
    expect(detail.fieldName).toBe('email');
    expect(detail.dataType).toBe('varchar');
  });

  it('should support report relation', () => {
    const detail = new ReportDetail();
    const report = new Report();
    report.id = 1;
    detail.report = report;
    expect(detail.report.id).toBe(1);
  });
});
