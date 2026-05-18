import { RoleSeed } from './role.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from 'src/users/entity/roles.entity';
import { Permission } from 'src/users/entity/permissions.entity';

const mockRoleSave = jest.fn();
const mockRoleFindOne = jest.fn();
const mockRoleCreate = jest.fn().mockImplementation((opts) => ({ ...opts }));
const mockPermissionFind = jest.fn();

const mockRoleRepository = {
  findOne: mockRoleFindOne,
  create: mockRoleCreate,
  save: mockRoleSave,
};

const mockPermissionRepository = {
  find: mockPermissionFind,
};

const mockApplicationContext = {
  get: jest.fn().mockImplementation((token) => {
    if (token === getRepositoryToken(Role)) {
      return mockRoleRepository;
    }
    if (token === getRepositoryToken(Permission)) {
      return mockPermissionRepository;
    }
    return null;
  }),
};

function resetMocks() {
  mockRoleSave.mockClear();
  mockRoleFindOne.mockClear();
  mockRoleCreate.mockClear();
  mockPermissionFind.mockClear();
}

describe('RoleSeed', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should create super-admin role when it does not exist', async () => {
    mockRoleFindOne.mockResolvedValue(null);
    mockPermissionFind.mockResolvedValue([
      { id: 1, name: 'report.view' },
      { id: 2, name: 'report.create' },
    ]);

    await RoleSeed.run(mockApplicationContext as any);

    expect(mockRoleCreate).toHaveBeenCalledWith({ name: 'super-admin' });
    expect(mockRoleSave).toHaveBeenCalled();
  });

  it('should assign all permissions to existing super-admin role', async () => {
    const existingRole = {
      id: 1,
      name: 'super-admin',
      permissions: [{ id: 1, name: 'report.view' }],
    };
    mockRoleFindOne.mockResolvedValue(existingRole);
    mockPermissionFind.mockResolvedValue([
      { id: 1, name: 'report.view' },
      { id: 2, name: 'report.create' },
    ]);

    await RoleSeed.run(mockApplicationContext as any);

    expect(mockRoleCreate).not.toHaveBeenCalled();
    expect(mockRoleSave).toHaveBeenCalled();
    const savedRole = mockRoleSave.mock.calls[0][0];
    const permNames = savedRole.permissions.map((p) => p.name);
    expect(permNames).toContain('report.view');
    expect(permNames).toContain('report.create');
  });

  it('should deduplicate permissions', async () => {
    const perm = { id: 1, name: 'report.view' };
    const existingRole = { id: 1, name: 'super-admin', permissions: [perm] };
    mockRoleFindOne.mockResolvedValue(existingRole);
    mockPermissionFind.mockResolvedValue([perm]);

    await RoleSeed.run(mockApplicationContext as any);

    expect(mockRoleSave).toHaveBeenCalled();
    const savedRole = mockRoleSave.mock.calls[0][0];
    expect(savedRole.permissions).toHaveLength(1);
  });

  it('should handle empty permissions list', async () => {
    mockRoleFindOne.mockResolvedValue(null);
    mockPermissionFind.mockResolvedValue([]);

    await RoleSeed.run(mockApplicationContext as any);

    expect(mockRoleCreate).toHaveBeenCalledWith({ name: 'super-admin' });
    expect(mockRoleSave).toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    mockRoleFindOne.mockRejectedValue(new Error('Database error'));

    await expect(RoleSeed.run(mockApplicationContext as any)).rejects.toThrow(
      'Database error',
    );
  });
});
