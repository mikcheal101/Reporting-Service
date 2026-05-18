import 'reflect-metadata';
import PermissionDto from './permission.dto';

describe('PermissionDto', () => {
  it('should create a valid dto', () => {
    const dto = new PermissionDto();
    dto.id = 1;
    dto.name = 'report.view';
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('report.view');
  });
});
