import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entity/users.entity';
import { Role } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { UserUtils } from 'src/common/utils/user.utils';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let rolesRepository: Repository<Role>;
  let permissionsRepository: Repository<Permission>;
  let userUtils: UserUtils;

  const mockUser: User = {
    id: 1,
    username: 'test@test.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    phoneNumber: '1234567890',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    permissions: [],
  };

  const mockUserResponseDto: UserResponseDto = {
    id: 1,
    username: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    phoneNumber: '1234567890',
    isActive: true,
    lastLogin: null,
    roles: [],
    permissions: [],
    createdAt: new Date(),
  };

  const mockUsersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockRolesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockPermissionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserUtils = {
    mapUserToUserResponseDto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionsRepository,
        },
        {
          provide: UserUtils,
          useValue: mockUserUtils,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    rolesRepository = module.get(getRepositoryToken(Role));
    permissionsRepository = module.get(getRepositoryToken(Permission));
    userUtils = module.get<UserUtils>(UserUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneAsync', () => {
    it('should find a user by username', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneAsync('test@test.com');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'test@test.com', isActive: true },
      });
    });

    it('should return null when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneAsync('nonexistent@test.com');

      expect(result).toBeNull();
    });

    it('should propagate repository errors', async () => {
      mockUsersRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findOneAsync('test@test.com')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findAsync', () => {
    it('should return all active users as DTOs', async () => {
      mockUsersRepository.find.mockResolvedValue([mockUser]);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(
        mockUserResponseDto,
      );

      const result = await service.findAsync();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockUserResponseDto);
      expect(mockUsersRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: { roles: { permissions: true }, permissions: true },
      });
    });

    it('should return empty array when no users', async () => {
      mockUsersRepository.find.mockResolvedValue([]);

      const result = await service.findAsync();

      expect(result).toEqual([]);
    });

    it('should propagate repository errors', async () => {
      mockUsersRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAsync()).rejects.toThrow('DB error');
    });
  });

  describe('findOneByIdAsync', () => {
    it('should find a user by id and return DTO', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(
        mockUserResponseDto,
      );

      const result = await service.findOneByIdAsync(1);

      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneByIdAsync(999)).rejects.toThrow(
        'User not found',
      );
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findOneByIdAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('createUserAsync', () => {
    it('should create a new user', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      mockUsersRepository.create.mockReturnValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(mockUser);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(
        mockUserResponseDto,
      );

      const result = await service.createUserAsync(
        'test@test.com',
        'password123',
        'Test',
        'User',
        '1234567890',
      );

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        username: 'test@test.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        middleName: undefined,
        phoneNumber: '1234567890',
      });
    });

    it('should return existing user if username already exists', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(
        mockUserResponseDto,
      );

      const result = await service.createUserAsync(
        'test@test.com',
        'password123',
        'Test',
        'User',
        '1234567890',
      );

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(
        service.createUserAsync('test@test.com', 'pwd', 'T', 'U', '123'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('updateUserAsync', () => {
    it('should update an existing user', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated' };
      const updatedDto = { ...mockUserResponseDto, firstName: 'Updated' };
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(updatedUser);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(updatedDto);

      const result = await service.updateUserAsync(
        1,
        'test@test.com',
        'Updated',
        'User',
        '1234567890',
      );

      expect(result).toEqual(updatedDto);
    });

    it('should throw when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUserAsync(999, 'test@test.com', 'T', 'U', '123'),
      ).rejects.toThrow('User not found');
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateUserAsync(1, 'test@test.com', 'T', 'U', '123'),
      ).rejects.toThrow('DB error');
    });
  });

  describe('deleteUserAsync', () => {
    it('should delete a user', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.deleteUserAsync(1);

      expect(result).toBe(true);
      expect(mockUsersRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteUserAsync(999)).rejects.toThrow(
        'User not found',
      );
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteUserAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('assignRoleAsync', () => {
    const adminRole: Role = {
      id: 1,
      name: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
      users: [],
    };
    const superAdminRole: Role = {
      id: 2,
      name: 'super-admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
      users: [],
    };

    it('should assign roles to a user', async () => {
      const userWithRoles = { ...mockUser, roles: [] };
      mockUsersRepository.findOne.mockResolvedValue(userWithRoles);
      mockRolesRepository.findBy.mockResolvedValue([adminRole]);
      mockUsersRepository.save.mockResolvedValue({
        ...userWithRoles,
        roles: [adminRole],
      });

      const result = await service.assignRoleAsync(1, [1]);

      expect(result).toBe(true);
    });

    it('should throw when no role ids provided', async () => {
      await expect(service.assignRoleAsync(1, [])).rejects.toThrow(
        'No roles selected to assign!',
      );
    });

    it('should throw when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRoleAsync(999, [1])).rejects.toThrow(
        'User with ID 999 was not found',
      );
    });

    it('should throw when trying to assign super-admin', async () => {
      mockUsersRepository.findOne.mockResolvedValue({ ...mockUser, roles: [] });
      mockRolesRepository.findBy.mockResolvedValue([superAdminRole]);

      await expect(service.assignRoleAsync(1, [2])).rejects.toThrow(
        'Cannot assign super administrator rights to any user!',
      );
    });

    it('should throw when trying to remove super-admin rights', async () => {
      const userWithSuperAdmin = { ...mockUser, roles: [superAdminRole] };
      mockUsersRepository.findOne.mockResolvedValue(userWithSuperAdmin);
      mockRolesRepository.findBy.mockResolvedValue([adminRole]);

      await expect(service.assignRoleAsync(1, [1])).rejects.toThrow(
        'Cannot remove super admin rights!',
      );
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.assignRoleAsync(1, [1])).rejects.toThrow('DB error');
    });
  });

  describe('assignPermissionAsync', () => {
    const mockPermission: Permission = {
      id: 1,
      name: 'read:users',
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: [],
      users: [],
    };

    it('should assign a permission to a user', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        permissions: [],
      });
      mockPermissionsRepository.findOne.mockResolvedValue(mockPermission);
      mockUsersRepository.save.mockResolvedValue({
        ...mockUser,
        permissions: [mockPermission],
      });

      const result = await service.assignPermissionAsync(1, 1);

      expect(result).toBe(true);
    });

    it('should return true if permission already assigned', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        permissions: [mockPermission],
      });
      mockPermissionsRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.assignPermissionAsync(1, 1);

      expect(result).toBe(true);
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when user not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPermissionAsync(999, 1)).rejects.toThrow(
        'User with ID 999 was not found',
      );
    });

    it('should throw when permission not found', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        permissions: [],
      });
      mockPermissionsRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPermissionAsync(1, 999)).rejects.toThrow(
        'Permission with ID 999 not found',
      );
    });

    it('should propagate errors', async () => {
      mockUsersRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.assignPermissionAsync(1, 1)).rejects.toThrow(
        'DB error',
      );
    });
  });
});
