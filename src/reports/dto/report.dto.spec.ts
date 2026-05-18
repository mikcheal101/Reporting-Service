import 'reflect-metadata';
import { ReportDto } from './report.dto';

describe('ReportDto', () => {
  it('should create a valid dto', () => {
    const dto = new ReportDto();
    dto.id = 1;
    dto.name = 'Test Report';
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('Test Report');
  });
});
