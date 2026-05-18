import 'reflect-metadata';
import { UpdateReportTypeRequestDto } from './update-report-type.request.dto';

describe('UpdateReportTypeRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new UpdateReportTypeRequestDto();
    dto.name = 'Updated Report';
    dto.emailsToNotify = 'admin@test.com';
    dto.frequency = 2;
    dto.outputType = 1;
    dto.runDate = '2025-01-01';
    dto.runTime = '09:00';
    expect(dto.name).toBe('Updated Report');
    expect(dto.runTime).toBe('09:00');
  });
});
