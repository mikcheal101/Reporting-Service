import 'reflect-metadata';
import { CreateReportTypeRequestDto } from './create-report-type.request.dto';

describe('CreateReportTypeRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new CreateReportTypeRequestDto();
    dto.name = 'Daily Report';
    dto.emailsToNotify = 'admin@test.com';
    dto.frequency = 1;
    dto.outputType = 0;
    dto.runDate = '2025-01-01';
    dto.runTime = '08:00';
    expect(dto.name).toBe('Daily Report');
    expect(dto.frequency).toBe(1);
  });
});
