import 'reflect-metadata';
import { UpdateReportRequestDto } from './update-report.request.dto';

describe('UpdateReportRequestDto', () => {
  it('should create a valid dto', () => {
    const dto = new UpdateReportRequestDto();
    dto.name = 'Updated Report';
    dto.connectionId = 2;
    expect(dto.name).toBe('Updated Report');
    expect(dto.connectionId).toBe(2);
  });
});
