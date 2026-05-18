import { Test, TestingModule } from '@nestjs/testing';
import { UserUtils } from './user.utils';
import { RoleUtils } from './role.utils';
import { PermissionUtils } from './permission.utils';
import { User } from 'src/users/entity/users.entity';
import { Role } from 'src/users/entity/roles.entity';
import { Permission } from 'src/users/entity/permissions.entity';

describe('UserUtils', () => {
  let userUtils: UserUtils;
  let roleUtils: RoleUtils;
  let permissionUtils: PermissionUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUtils,
        {
          provide: RoleUtils,
          useValue: {
            mapRoleToDto: jest.fn().mockImplementation((role: Role) => ({
              id: role.id,
              name: role.name,
              createdAt: role.createdAt,
              permissions: [],
            })),
          },
        },
        {
          provide: PermissionUtils,
          useValue: {
            mapPermissionToDto: jest
              .fn()
              .mockImplementation((perm: Permission) => ({
                id: perm.id,
                name: perm.name,
                createdAt: perm.createdAt,
              })),
          },
        },
      ],
    }).compile();

    userUtils = module.get<UserUtils>(UserUtils);
    roleUtils = module.get<RoleUtils>(RoleUtils);
    permissionUtils = module.get<PermissionUtils>(PermissionUtils);
  });

  const createMockUser = (overrides: Partial<User> = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 1,
      username: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'M',
      phoneNumber: '+1234567890',
      isActive: true,
      lastLogin: new Date('2025-01-01'),
      createdAt: new Date('2024-01-01'),
      roles: [],
      permissions: [],
      ...overrides,
    });
    return user;
  };

  it('should map user with roles and permissions', () => {
    const perm1 = new Permission();
    Object.assign(perm1, { id: 1, name: 'report.view', createdAt: new Date() });

    const perm2 = new Permission();
    Object.assign(perm2, {
      id: 2,
      name: 'report.create',
      createdAt: new Date(),
    });

    const role = new Role();
    Object.assign(role, {
      id: 1,
      name: 'admin',
      createdAt: new Date(),
      permissions: [perm1, perm2],
    });

    const user = createMockUser({ roles: [role] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.id).toBe(1);
    expect(result.username).toBe('test@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.middleName).toBe('M');
    expect(result.phoneNumber).toBe('+1234567890');
    expect(result.isActive).toBe(true);
    expect(result.lastLogin).toEqual(user.lastLogin);
    expect(result.createdAt).toEqual(user.createdAt);
    expect(result.roles).toHaveLength(1);
    expect(result.roles[0].name).toBe('admin');
    expect(result.permissions).toHaveLength(2);
    expect(roleUtils.mapRoleToDto).toHaveBeenCalled();
    expect(permissionUtils.mapPermissionToDto).toHaveBeenCalledWith(
      perm1,
      expect.anything(),
      expect.anything(),
    );
    expect(permissionUtils.mapPermissionToDto).toHaveBeenCalledWith(
      perm2,
      expect.anything(),
      expect.anything(),
    );
  });

  it('should merge permissions from roles and user direct permissions', () => {
    const userPerm = new Permission();
    Object.assign(userPerm, {
      id: 1,
      name: 'user.direct',
      createdAt: new Date(),
    });

    const rolePerm = new Permission();
    Object.assign(rolePerm, {
      id: 2,
      name: 'role.inherited',
      createdAt: new Date(),
    });

    const role = new Role();
    Object.assign(role, {
      id: 1,
      name: 'editor',
      createdAt: new Date(),
      permissions: [rolePerm],
    });

    const user = createMockUser({ roles: [role], permissions: [userPerm] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.permissions).toHaveLength(2);
    const names = result.permissions.map((p) => p.name);
    expect(names).toContain('user.direct');
    expect(names).toContain('role.inherited');
  });

  it('should handle user with no roles and no permissions', () => {
    const user = createMockUser({ roles: [], permissions: [] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should handle user with null roles', () => {
    const user = createMockUser({ roles: null, permissions: [] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should handle user with null permissions on user', () => {
    const user = createMockUser({ roles: [], permissions: null });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should handle user with role that has null permissions', () => {
    const role = new Role();
    Object.assign(role, {
      id: 1,
      name: 'viewer',
      createdAt: new Date(),
      permissions: null,
    });

    const user = createMockUser({ roles: [role], permissions: [] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toHaveLength(1);
    expect(result.permissions).toEqual([]);
  });

  it('should deduplicate permissions from multiple roles', () => {
    const sharedPerm = new Permission();
    Object.assign(sharedPerm, {
      id: 1,
      name: 'shared.perm',
      createdAt: new Date(),
    });

    const role1 = new Role();
    Object.assign(role1, {
      id: 1,
      name: 'role1',
      createdAt: new Date(),
      permissions: [sharedPerm],
    });

    const role2 = new Role();
    Object.assign(role2, {
      id: 2,
      name: 'role2',
      createdAt: new Date(),
      permissions: [sharedPerm],
    });

    const user = createMockUser({ roles: [role1, role2], permissions: [] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.permissions).toHaveLength(1);
    expect(result.permissions[0].name).toBe('shared.perm');
  });

  it('should handle user with undefined roles', () => {
    const user = createMockUser({ roles: undefined, permissions: [] });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it('should handle user with undefined permissions', () => {
    const user = createMockUser({ roles: [], permissions: undefined });

    const result = userUtils.mapUserToUserResponseDto(user);

    expect(result.roles).toEqual([]);
    expect(result.permissions).toEqual([]);
  });
});
