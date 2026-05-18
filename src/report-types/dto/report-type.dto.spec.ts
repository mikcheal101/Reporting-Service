import 'reflect-metadata';
import { ReportTypeDto } from './report-type.dto';

describe('ReportTypeDto', () => {
  it('should create a valid dto', () => {
    const dto = new ReportTypeDto();
    dto.id = 1;
    dto.name = 'Daily Report';
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('Daily Report');
  });
});
