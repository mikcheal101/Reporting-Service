import { Test, TestingModule } from '@nestjs/testing';
import { RoleUtils } from './role.utils';
import { PermissionUtils } from './permission.utils';
import { Role } from 'src/users/entity/roles.entity';
import { Permission } from 'src/users/entity/permissions.entity';

describe('RoleUtils', () => {
  let roleUtils: RoleUtils;
  let permissionUtils: PermissionUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleUtils,
        {
          provide: PermissionUtils,
          useValue: {
            mapPermissionToDto: jest.fn(),
          },
        },
      ],
    }).compile();

    roleUtils = module.get<RoleUtils>(RoleUtils);
    permissionUtils = module.get<PermissionUtils>(PermissionUtils);
  });

  const createMockPermission = (id: number, name: string): Permission => {
    const perm = new Permission();
    Object.assign(perm, { id, name, createdAt: new Date() });
    return perm;
  };

  const createMockRole = (overrides: Partial<Role> = {}): Role => {
    const role = new Role();
    Object.assign(role, {
      id: 1,
      name: 'admin',
      createdAt: new Date(),
      permissions: [],
      ...overrides,
    });
    return role;
  };

  it('should map role to dto with permissions', () => {
    const perm1 = createMockPermission(1, 'report.view');
    const perm2 = createMockPermission(2, 'report.create');

    jest
      .spyOn(permissionUtils, 'mapPermissionToDto')
      .mockImplementation((perm: Permission) => ({
        id: perm.id,
        name: perm.name,
        createdAt: perm.createdAt,
      }));

    const role = createMockRole({ permissions: [perm1, perm2] });
    const result = roleUtils.mapRoleToDto(role);

    expect(result.id).toBe(1);
    expect(result.name).toBe('admin');
    expect(result.createdAt).toBeDefined();
    expect(result.permissions).toHaveLength(2);
    expect(result.permissions[0].name).toBe('report.view');
    expect(result.permissions[1].name).toBe('report.create');
    expect(permissionUtils.mapPermissionToDto).toHaveBeenCalledTimes(2);
  });

  it('should map role with no permissions', () => {
    const role = createMockRole({ permissions: [] });
    const result = roleUtils.mapRoleToDto(role);

    expect(result.id).toBe(1);
    expect(result.name).toBe('admin');
    expect(result.permissions).toEqual([]);
  });

  it('should map role with null permissions', () => {
    const role = createMockRole({ permissions: null });
    const result = roleUtils.mapRoleToDto(role);

    expect(result.id).toBe(1);
    expect(result.name).toBe('admin');
    expect(result.permissions).toBeUndefined();
  });

  it('should map role with undefined permissions', () => {
    const role = createMockRole({ permissions: undefined });
    const result = roleUtils.mapRoleToDto(role);

    expect(result.id).toBe(1);
    expect(result.name).toBe('admin');
    expect(result.permissions).toBeUndefined();
  });
});
