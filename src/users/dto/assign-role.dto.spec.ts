import 'reflect-metadata';
import AssignRoleDto from './assign-role.dto';

describe('AssignRoleDto', () => {
  it('should create a valid dto', () => {
    const dto = new AssignRoleDto();
    dto.userId = 1;
    dto.roleIds = [1, 2, 3];
    expect(dto.userId).toBe(1);
    expect(dto.roleIds).toEqual([1, 2, 3]);
  });
});
