import 'reflect-metadata';
import { Connection } from 'src/connections/entity/connections.entity';
import { ReportType } from 'src/report-types/entity/report-types.entity';
import { Report } from './report.entity';
import { ReportDetail } from './report-detail.entity';
import { QueryParameter } from './query-parameter.entity';
import { Task } from 'src/tasks/entity/task.entity';

describe('Report Entity', () => {
  it('should create a report instance', () => {
    const report = new Report();
    report.id = 1;
    report.name = 'Test Report';
    report.description = 'A test report';
    expect(report.name).toBe('Test Report');
    expect(report.description).toBe('A test report');
  });

  it('should support all relations', () => {
    const report = new Report();
    const connection = new Connection();
    connection.id = 1;
    const reportType = new ReportType();
    reportType.id = 1;
    const detail = new ReportDetail();
    detail.id = 1;
    const param = new QueryParameter();
    param.id = 1;
    const task = new Task();
    task.id = 1;
    report.connection = connection;
    report.reportType = reportType;
    report.reportDetails = [detail];
    report.parameters = [param];
    report.task = task;
    expect(report.connection.id).toBe(1);
    expect(report.reportType.id).toBe(1);
    expect(report.reportDetails).toHaveLength(1);
    expect(report.parameters).toHaveLength(1);
    expect(report.task.id).toBe(1);
  });
});
