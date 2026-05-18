import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import AssignRoleDto from './dto/assign-role.dto';
import AssignPermissionDto from './dto/assign-permission.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

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

  const mockUsersService = {
    findAsync: jest.fn(),
    findOneByIdAsync: jest.fn(),
    createUserAsync: jest.fn(),
    updateUserAsync: jest.fn(),
    deleteUserAsync: jest.fn(),
    assignRoleAsync: jest.fn(),
    assignPermissionAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('users', () => {
    it('should return all users', async () => {
      mockUsersService.findAsync.mockResolvedValue([mockUserResponseDto]);

      const result = await controller.users();

      expect(result).toEqual([mockUserResponseDto]);
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.findAsync.mockRejectedValue(new Error('Service error'));

      await expect(controller.users()).rejects.toThrow('Service error');
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOneByIdAsync.mockResolvedValue(mockUserResponseDto);

      const result = await controller.user('1');

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersService.findOneByIdAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.findOneByIdAsync.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.user('999')).rejects.toThrow('Not found');
    });
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      username: 'new@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone: '1234567890',
      middleName: undefined,
    };

    it('should create a user', async () => {
      mockUsersService.createUserAsync.mockResolvedValue(mockUserResponseDto);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersService.createUserAsync).toHaveBeenCalledWith(
        'new@test.com',
        'password123',
        'New',
        'User',
        '1234567890',
        undefined,
      );
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.createUserAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updated@test.com',
      firstName: 'Updated',
      lastName: 'User',
      phone: '1234567890',
      middleName: undefined,
    };

    it('should update a user', async () => {
      mockUsersService.updateUserAsync.mockResolvedValue(mockUserResponseDto);

      const result = await controller.updateUser('1', updateUserDto);

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersService.updateUserAsync).toHaveBeenCalledWith(
        1,
        'updated@test.com',
        'Updated',
        'User',
        '1234567890',
        undefined,
      );
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.updateUserAsync.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.updateUser('1', updateUserDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockUsersService.deleteUserAsync.mockResolvedValue(true);

      const result = await controller.deleteUser('1');

      expect(result).toBe(true);
      expect(mockUsersService.deleteUserAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.deleteUserAsync.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteUser('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = { userId: 1, roleIds: [1, 2] };

    it('should assign roles', async () => {
      mockUsersService.assignRoleAsync.mockResolvedValue(true);

      const result = await controller.assignRole(assignRoleDto);

      expect(result).toBe(true);
      expect(mockUsersService.assignRoleAsync).toHaveBeenCalledWith(1, [1, 2]);
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.assignRoleAsync.mockRejectedValue(
        new Error('Assignment failed'),
      );

      await expect(controller.assignRole(assignRoleDto)).rejects.toThrow(
        'Assignment failed',
      );
    });
  });

  describe('assignPermission', () => {
    const assignPermissionDto: AssignPermissionDto = {
      userId: 1,
      permissionId: 1,
    };

    it('should assign a permission', async () => {
      mockUsersService.assignPermissionAsync.mockResolvedValue(true);

      const result = await controller.assignPermission(assignPermissionDto);

      expect(result).toBe(true);
      expect(mockUsersService.assignPermissionAsync).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException on service error', async () => {
      mockUsersService.assignPermissionAsync.mockRejectedValue(
        new Error('Assignment failed'),
      );

      await expect(
        controller.assignPermission(assignPermissionDto),
      ).rejects.toThrow('Assignment failed');
    });
  });
});
