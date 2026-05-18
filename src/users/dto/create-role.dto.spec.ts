import 'reflect-metadata';
import CreateRoleDto from './create-role.dto';

describe('CreateRoleDto', () => {
  it('should create a valid dto', () => {
    const dto = new CreateRoleDto();
    dto.name = 'admin';
    dto.permissions = [];
    expect(dto.name).toBe('admin');
    expect(dto.permissions).toEqual([]);
  });
});
