import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from 'src/users/entity/permissions.entity';
import { PermissionUtils } from 'src/common/utils/permission.utils';
import PermissionDto from 'src/users/dto/permission.dto';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionsRepository: Repository<Permission>;
  let permissionUtils: PermissionUtils;

  const mockPermission: Permission = {
    id: 1,
    name: 'read:users',
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    users: [],
  };

  const mockPermissionDto: PermissionDto = {
    id: 1,
    name: 'read:users',
    createdAt: new Date(),
  };

  const mockPermissionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };

  const mockPermissionUtils = {
    mapPermissionToDto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionsRepository,
        },
        {
          provide: PermissionUtils,
          useValue: mockPermissionUtils,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionsRepository = module.get(getRepositoryToken(Permission));
    permissionUtils = module.get<PermissionUtils>(PermissionUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllAsync', () => {
    it('should return all permissions', async () => {
      mockPermissionsRepository.find.mockResolvedValue([mockPermission]);
      mockPermissionUtils.mapPermissionToDto.mockReturnValue(mockPermissionDto);

      const result = await service.findAllAsync();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPermissionDto);
    });

    it('should return empty array when no permissions', async () => {
      mockPermissionsRepository.find.mockResolvedValue([]);

      const result = await service.findAllAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockPermissionsRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAllAsync()).rejects.toThrow('DB error');
    });
  });
});
