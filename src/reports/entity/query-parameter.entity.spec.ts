import 'reflect-metadata';
import { QueryParameter } from './query-parameter.entity';
import { Report } from './report.entity';

describe('QueryParameter Entity', () => {
  it('should create a query parameter instance', () => {
    const param = new QueryParameter();
    param.id = 1;
    param.name = 'param1';
    param.value = 'value1';
    param.dataType = 'string';
    expect(param.name).toBe('param1');
    expect(param.value).toBe('value1');
    expect(param.dataType).toBe('string');
  });

  it('should support report relation', () => {
    const param = new QueryParameter();
    const report = new Report();
    report.id = 1;
    param.report = report;
    expect(param.report.id).toBe(1);
  });
});
