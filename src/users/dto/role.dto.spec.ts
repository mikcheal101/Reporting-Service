import 'reflect-metadata';
import { RoleDto } from './role.dto';

describe('RoleDto', () => {
  it('should create a valid dto', () => {
    const dto = new RoleDto();
    dto.id = 1;
    dto.name = 'super-admin';
    expect(dto.id).toBe(1);
    expect(dto.name).toBe('super-admin');
  });
});
