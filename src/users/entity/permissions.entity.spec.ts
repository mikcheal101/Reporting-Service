import 'reflect-metadata';
import { Permission } from './permissions.entity';
import { Role } from './roles.entity';
import { User } from './users.entity';

describe('Permission Entity', () => {
  it('should create a permission instance', () => {
    const permission = new Permission();
    permission.id = 1;
    permission.name = 'report.view';
    expect(permission.name).toBe('report.view');
  });

  it('should support role and user relations', () => {
    const permission = new Permission();
    const role = new Role();
    role.id = 1;
    const user = new User();
    user.id = 1;
    permission.roles = [role];
    permission.users = [user];
    expect(permission.roles).toHaveLength(1);
    expect(permission.users).toHaveLength(1);
  });
});
