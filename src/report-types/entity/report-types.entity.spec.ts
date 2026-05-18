import 'reflect-metadata';
import { ReportType } from './report-types.entity';
import { Report } from 'src/reports/entity/report.entity';

describe('ReportType Entity', () => {
  it('should create a report type instance', () => {
    const entity = new ReportType();
    entity.id = 1;
    entity.name = 'Daily Report';
    expect(entity.name).toBe('Daily Report');
  });

  it('should support report relation', () => {
    const entity = new ReportType();
    const report = new Report();
    report.id = 1;
    entity.reports = [report];
    expect(entity.reports).toHaveLength(1);
  });
});
