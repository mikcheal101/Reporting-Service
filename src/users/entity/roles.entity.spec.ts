import 'reflect-metadata';
import { Role } from './roles.entity';
import { Permission } from './permissions.entity';
import { User } from './users.entity';

describe('Role Entity', () => {
  it('should create a role instance', () => {
    const role = new Role();
    role.id = 1;
    role.name = 'super-admin';
    expect(role.name).toBe('super-admin');
  });

  it('should support permission and user relations', () => {
    const role = new Role();
    const permission = new Permission();
    permission.id = 1;
    permission.name = 'report.view';
    const user = new User();
    user.id = 1;
    role.permissions = [permission];
    role.users = [user];
    expect(role.permissions).toHaveLength(1);
    expect(role.users).toHaveLength(1);
  });
});
