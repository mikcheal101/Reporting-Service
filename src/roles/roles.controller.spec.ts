import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import CreateRoleDto from 'src/users/dto/create-role.dto';
import UpdateRoleDto from 'src/users/dto/update-role.dto';
import { RoleDto } from 'src/users/dto/role.dto';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: RolesService;

  const mockRoleDto: RoleDto = {
    id: 1,
    name: 'admin',
    permissions: [{ id: 1, name: 'read:users', createdAt: new Date() }],
    createdAt: new Date(),
  };

  const mockRolesService = {
    findAllAsync: jest.fn(),
    findOneAsync: jest.fn(),
    createAsync: jest.fn(),
    updateAsync: jest.fn(),
    deleteAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('roles', () => {
    it('should return all roles', async () => {
      mockRolesService.findAllAsync.mockResolvedValue([mockRoleDto]);

      const result = await controller.roles();

      expect(result).toEqual([mockRoleDto]);
    });

    it('should throw BadRequestException on error', async () => {
      mockRolesService.findAllAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.roles()).rejects.toThrow('Fetch failed');
    });
  });

  describe('role', () => {
    it('should return a role by id', async () => {
      mockRolesService.findOneAsync.mockResolvedValue(mockRoleDto);

      const result = await controller.role('1');

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesService.findOneAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockRolesService.findOneAsync.mockRejectedValue(new Error('Not found'));

      await expect(controller.role('999')).rejects.toThrow('Not found');
    });
  });

  describe('createRole', () => {
    const createDto: CreateRoleDto = {
      name: 'editor',
      permissions: [{ id: 1, name: 'read', createdAt: new Date() }],
    };

    it('should create a role', async () => {
      mockRolesService.createAsync.mockResolvedValue(mockRoleDto);

      const result = await controller.createRole(createDto);

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesService.createAsync).toHaveBeenCalledWith('editor', [
        { id: 1, name: 'read', createdAt: expect.any(Date) },
      ]);
    });

    it('should throw BadRequestException on error', async () => {
      mockRolesService.createAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createRole(createDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateRole', () => {
    const updateDto: UpdateRoleDto = {
      id: 1,
      name: 'editor',
      permissions: [{ id: 2, name: 'write', createdAt: new Date() }],
    };

    it('should update a role', async () => {
      mockRolesService.updateAsync.mockResolvedValue(mockRoleDto);

      const result = await controller.updateRole('1', updateDto);

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesService.updateAsync).toHaveBeenCalledWith(1, 'editor', [
        { id: 2, name: 'write', createdAt: expect.any(Date) },
      ]);
    });

    it('should throw BadRequestException on error', async () => {
      mockRolesService.updateAsync.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.updateRole('1', updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      mockRolesService.deleteAsync.mockResolvedValue(true);

      const result = await controller.deleteRole('1');

      expect(result).toBe(true);
      expect(mockRolesService.deleteAsync).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on error', async () => {
      mockRolesService.deleteAsync.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteRole('1')).rejects.toThrow('Delete failed');
    });
  });
});
