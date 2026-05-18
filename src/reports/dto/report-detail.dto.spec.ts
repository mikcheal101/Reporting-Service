import 'reflect-metadata';
import { ReportDetailDto } from './report-detail.dto';

describe('ReportDetailDto', () => {
  it('should create a valid dto', () => {
    const dto = new ReportDetailDto();
    dto.id = 1;
    dto.tableName = 'users';
    dto.fieldName = 'email';
    expect(dto.id).toBe(1);
    expect(dto.tableName).toBe('users');
    expect(dto.fieldName).toBe('email');
  });
});
