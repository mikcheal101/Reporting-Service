import { UserSeed } from './user.seed';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entity/users.entity';
import { Role } from 'src/users/entity/roles.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const mockUserSave = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserCreate = jest
  .fn()
  .mockImplementation((opts) => ({ ...opts, roles: [] }));
const mockRoleFind = jest.fn();

const mockUserRepository = {
  findOne: mockUserFindOne,
  create: mockUserCreate,
  save: mockUserSave,
};

const mockRoleRepository = {
  find: mockRoleFind,
};

const mockApplicationContext = {
  get: jest.fn().mockImplementation((token) => {
    if (token === getRepositoryToken(User)) {
      return mockUserRepository;
    }
    if (token === getRepositoryToken(Role)) {
      return mockRoleRepository;
    }
    return null;
  }),
};

function resetMocks() {
  mockUserSave.mockClear();
  mockUserFindOne.mockClear();
  mockUserCreate.mockClear();
  mockRoleFind.mockClear();
}

describe('UserSeed', () => {
  beforeAll(() => {
    process.env.HASHING_ROUNDS = '10';
  });

  beforeEach(() => {
    resetMocks();
  });

  it('should create default user when not existing', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockRoleFind.mockResolvedValue([{ id: 1, name: 'super-admin' }]);

    await UserSeed.run(mockApplicationContext as any);

    expect(mockUserCreate).toHaveBeenCalledWith({
      firstName: 'Super',
      lastName: 'Administrator',
      phoneNumber: '+234',
      username: 'super-admin@samlemail.com',
      password: 'hashed-password',
    });
    expect(mockUserSave).toHaveBeenCalled();
  });

  it('should update existing user with new roles', async () => {
    const existingUser = {
      id: 1,
      username: 'super-admin@samlemail.com',
      roles: [],
    };
    mockUserFindOne.mockResolvedValue(existingUser);
    mockRoleFind.mockResolvedValue([
      { id: 1, name: 'super-admin' },
      { id: 2, name: 'viewer' },
    ]);

    await UserSeed.run(mockApplicationContext as any);

    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockUserSave).toHaveBeenCalled();
    const savedUser = mockUserSave.mock.calls[0][0];
    const roleNames = savedUser.roles.map((r) => r.name);
    expect(roleNames).toContain('super-admin');
    expect(roleNames).toContain('viewer');
  });

  it('should not save if no roles available', async () => {
    const existingUser = {
      id: 1,
      username: 'super-admin@samlemail.com',
      roles: [],
    };
    mockUserFindOne.mockResolvedValue(existingUser);
    mockRoleFind.mockResolvedValue([]);

    await UserSeed.run(mockApplicationContext as any);

    expect(mockUserSave).not.toHaveBeenCalled();
  });

  it('should merge existing and new roles without duplicates', async () => {
    const existingRole = { id: 1, name: 'existing-role' };
    const existingUser = {
      id: 1,
      username: 'super-admin@samlemail.com',
      roles: [existingRole],
    };
    mockUserFindOne.mockResolvedValue(existingUser);
    mockRoleFind.mockResolvedValue([existingRole, { id: 2, name: 'new-role' }]);

    await UserSeed.run(mockApplicationContext as any);

    const savedUser = mockUserSave.mock.calls[0][0];
    expect(savedUser.roles).toHaveLength(2);
  });

  it('should handle repository errors', async () => {
    mockUserFindOne.mockRejectedValue(new Error('Database error'));

    await expect(UserSeed.run(mockApplicationContext as any)).rejects.toThrow(
      'Database error',
    );
  });
});
