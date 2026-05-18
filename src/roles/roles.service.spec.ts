import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from 'src/users/entity/roles.entity';
import { RoleUtils } from 'src/common/utils/role.utils';
import { RoleDto } from 'src/users/dto/role.dto';
import PermissionRequestDto from 'src/users/dto/permission.request.dto';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: Repository<Role>;
  let roleUtils: RoleUtils;

  const mockRole: Role = {
    id: 1,
    name: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [
      {
        id: 1,
        name: 'read:users',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: [],
        users: [],
      },
    ],
    users: [],
  };

  const mockRoleDto: RoleDto = {
    id: 1,
    name: 'admin',
    permissions: [{ id: 1, name: 'read:users', createdAt: new Date() }],
    createdAt: new Date(),
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

  const mockRoleUtils = {
    mapRoleToDto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
        {
          provide: RoleUtils,
          useValue: mockRoleUtils,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get(getRepositoryToken(Role));
    roleUtils = module.get<RoleUtils>(RoleUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAsync', () => {
    const permissions: PermissionRequestDto[] = [
      { id: 1, name: 'read', createdAt: new Date() },
    ];

    it('should create a new role', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(null);
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(mockRoleDto);
      mockRolesRepository.save.mockResolvedValue(mockRole);
      mockRolesRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.createAsync('admin', permissions);

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesRepository.save).toHaveBeenCalledWith({
        name: 'admin',
        permissions: [{ id: 1 }],
      });
    });

    it('should throw when role already exists', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);

      await expect(service.createAsync('admin', permissions)).rejects.toThrow(
        'Role already exists',
      );
    });

    it('should convert name to lowercase', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(null);
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(mockRoleDto);
      mockRolesRepository.save.mockResolvedValue(mockRole);
      mockRolesRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.createAsync('ADMIN', permissions);

      expect(mockRolesRepository.save).toHaveBeenCalledWith({
        name: 'admin',
        permissions: [{ id: 1 }],
      });
    });

    it('should propagate errors', async () => {
      mockRolesRepository.findOne.mockResolvedValue(null);
      mockRolesRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(service.createAsync('admin', permissions)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('updateAsync', () => {
    const permissions: PermissionRequestDto[] = [
      { id: 2, name: 'write', createdAt: new Date() },
    ];

    it('should update a role', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(mockRoleDto);
      mockRoleUtils.mapRoleToDto.mockReturnValueOnce(mockRoleDto);
      mockRolesRepository.save.mockResolvedValue(mockRole);
      mockRolesRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.updateAsync(1, 'editor', permissions);

      expect(result).toEqual(mockRoleDto);
    });

    it('should throw when role not found', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(null);

      await expect(
        service.updateAsync(999, 'editor', permissions),
      ).rejects.toThrow('Role not found');
    });

    it('should throw when trying to update super-admin', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue({
        ...mockRoleDto,
        name: 'super-admin',
      });

      await expect(
        service.updateAsync(1, 'super-admin', permissions),
      ).rejects.toThrow('The super-admin role cannot be modified');
    });

    it('should propagate errors', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);
      mockRolesRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateAsync(1, 'editor', permissions),
      ).rejects.toThrow('DB error');
    });
  });

  describe('findOneAsync', () => {
    it('should find a role by id', async () => {
      mockRolesRepository.findOne.mockResolvedValue(mockRole);
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);

      const result = await service.findOneAsync(1);

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { permissions: true },
      });
    });

    it('should return null when not found', async () => {
      mockRolesRepository.findOne.mockResolvedValue(null);
      mockRoleUtils.mapRoleToDto.mockReturnValue(null);

      const result = await service.findOneAsync(999);

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockRolesRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findOneAsync(1)).rejects.toThrow('DB error');
    });
  });

  describe('findByNameAsync', () => {
    it('should find a role by name', async () => {
      mockRolesRepository.findOne.mockResolvedValue(mockRole);
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);

      const result = await service.findByNameAsync('admin');

      expect(result).toEqual(mockRoleDto);
      expect(mockRolesRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'admin' },
        relations: { permissions: true },
      });
    });

    it('should return null when not found', async () => {
      mockRolesRepository.findOne.mockResolvedValue(null);

      const result = await service.findByNameAsync('nonexistent');

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockRolesRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.findByNameAsync('admin')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('findAllAsync', () => {
    it('should return all roles', async () => {
      mockRolesRepository.find.mockResolvedValue([mockRole]);
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);

      const result = await service.findAllAsync();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRoleDto);
    });

    it('should return empty array when no roles', async () => {
      mockRolesRepository.find.mockResolvedValue([]);

      const result = await service.findAllAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockRolesRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAllAsync()).rejects.toThrow('DB error');
    });
  });

  describe('deleteAsync', () => {
    it('should delete a role', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);
      mockRolesRepository.findOne.mockResolvedValue(mockRole);
      mockRolesRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.deleteAsync(1);

      expect(result).toBe(true);
      expect(mockRolesRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw when role not found', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(null);

      await expect(service.deleteAsync(999)).rejects.toThrow('Role not found');
    });

    it('should throw when trying to delete super-admin', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue({
        ...mockRoleDto,
        name: 'super-admin',
      });

      await expect(service.deleteAsync(1)).rejects.toThrow(
        'The super-admin role cannot be modified',
      );
    });

    it('should propagate errors', async () => {
      mockRoleUtils.mapRoleToDto.mockReturnValue(mockRoleDto);
      mockRolesRepository.findOne.mockResolvedValue(mockRole);
      mockRolesRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteAsync(1)).rejects.toThrow('DB error');
    });
  });
});
