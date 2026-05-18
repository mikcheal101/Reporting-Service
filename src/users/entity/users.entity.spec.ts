import 'reflect-metadata';
import { User } from './users.entity';
import { Role } from './roles.entity';
import { Permission } from './permissions.entity';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const user = new User();
    user.id = 1;
    user.username = 'test@test.com';
    user.firstName = 'Test';
    user.lastName = 'User';
    user.phoneNumber = '+1234567890';
    user.password = 'hashed';
    user.isActive = true;
    expect(user.isActive).toBe(true);
    expect(user.username).toBe('test@test.com');
  });

  it('should support role and permission relations', () => {
    const user = new User();
    const role = new Role();
    role.id = 1;
    role.name = 'admin';
    const permission = new Permission();
    permission.id = 1;
    permission.name = 'report.view';
    user.roles = [role];
    user.permissions = [permission];
    expect(user.roles).toHaveLength(1);
    expect(user.permissions).toHaveLength(1);
    expect(user.roles[0].name).toBe('admin');
    expect(user.permissions[0].name).toBe('report.view');
  });
});
