import 'reflect-metadata';
import UpdateRoleDto from './update-role.dto';

describe('UpdateRoleDto', () => {
  it('should create a valid dto', () => {
    const dto = new UpdateRoleDto();
    dto.id = 1;
    dto.name = 'admin';
    dto.permissions = [];
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('admin');
    expect(dto.permissions).toEqual([]);
  });
});
