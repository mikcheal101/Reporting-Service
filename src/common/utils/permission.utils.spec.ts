import { Test, TestingModule } from '@nestjs/testing';
import { PermissionUtils } from './permission.utils';
import { Permission } from 'src/users/entity/permissions.entity';

describe('PermissionUtils', () => {
  let permissionUtils: PermissionUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionUtils],
    }).compile();

    permissionUtils = module.get<PermissionUtils>(PermissionUtils);
  });

  const createMockPermission = (
    overrides: Partial<Permission> = {},
  ): Permission => {
    const perm = new Permission();
    Object.assign(perm, {
      id: 1,
      name: 'report.view',
      createdAt: new Date('2025-01-01'),
      ...overrides,
    });
    return perm;
  };

  it('should map permission to dto', () => {
    const permission = createMockPermission();
    const result = permissionUtils.mapPermissionToDto(permission);

    expect(result.id).toBe(1);
    expect(result.name).toBe('report.view');
    expect(result.createdAt).toEqual(permission.createdAt);
  });

  it('should map permission with different values', () => {
    const permission = createMockPermission({
      id: 42,
      name: 'user.create',
      createdAt: new Date('2024-06-15'),
    });
    const result = permissionUtils.mapPermissionToDto(permission);

    expect(result.id).toBe(42);
    expect(result.name).toBe('user.create');
    expect(result.createdAt).toEqual(new Date('2024-06-15'));
  });
});
