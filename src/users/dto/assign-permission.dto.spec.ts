import 'reflect-metadata';
import AssignPermissionDto from './assign-permission.dto';

describe('AssignPermissionDto', () => {
  it('should create a valid dto', () => {
    const dto = new AssignPermissionDto();
    dto.userId = 1;
    dto.permissionId = 2;
    expect(dto.userId).toBe(1);
    expect(dto.permissionId).toBe(2);
  });
});
