import { PermissionSeed } from './permission.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from 'src/users/entity/permissions.entity';

const mockSave = jest.fn();
const mockCreate = jest.fn().mockImplementation((opts) => opts);
const mockFind = jest.fn();

const mockRepository = {
  find: mockFind,
  create: mockCreate,
  save: mockSave,
};

const mockApplicationContext = {
  get: jest.fn().mockImplementation((token) => {
    if (token === getRepositoryToken(Permission)) {
      return mockRepository;
    }
    return null;
  }),
};

describe('PermissionSeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create permissions that do not exist', async () => {
    mockFind.mockResolvedValue([
      { name: 'connection.view' },
      { name: 'connection.list' },
    ]);

    await PermissionSeed.run(mockApplicationContext as any);

    expect(mockFind).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    const createdPerm = mockCreate.mock.calls[0][0];
    expect(createdPerm.name).toBeDefined();
  });

  it('should not save if all permissions already exist', async () => {
    const allPermissions = [
      'connection.view',
      'connection.list',
      'connection.delete',
      'connection.update',
      'connection.create',
      'report-type.view',
      'report-type.list',
      'report-type.delete',
      'report-type.update',
      'report-type.create',
      'report.view',
      'report.list',
      'report.delete',
      'report.update',
      'report.create',
      'task.view',
      'task.list',
      'task.delete',
      'task.update',
      'task.create',
      'role.view',
      'role.list',
      'role.delete',
      'role.update',
      'role.create',
      'user.view',
      'user.list',
      'user.delete',
      'user.update',
      'user.create',
    ];

    mockFind.mockResolvedValue(allPermissions.map((name) => ({ name })));

    await PermissionSeed.run(mockApplicationContext as any);

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('should handle empty existing permissions', async () => {
    mockFind.mockResolvedValue([]);

    await PermissionSeed.run(mockApplicationContext as any);

    expect(mockCreate).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
  });

  it('should handle repository errors', async () => {
    mockFind.mockRejectedValue(new Error('Database error'));

    await expect(
      PermissionSeed.run(mockApplicationContext as any),
    ).rejects.toThrow('Database error');
  });
});
