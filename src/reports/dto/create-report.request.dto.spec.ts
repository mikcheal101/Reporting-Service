import 'reflect-metadata';
import { CreateReportRequestDto } from './create-report.request.dto';

describe('CreateReportRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new CreateReportRequestDto();
    dto.connectionId = 1;
    dto.name = 'Test Report';
    dto.reportTypeId = 1;
    expect(dto.connectionId).toBe(1);
    expect(dto.name).toBe('Test Report');
    expect(dto.reportTypeId).toBe(1);
  });
});
