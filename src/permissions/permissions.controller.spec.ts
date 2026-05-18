import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import PermissionDto from 'src/users/dto/permission.dto';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let permissionsService: PermissionsService;

  const mockPermissionDto: PermissionDto = {
    id: 1,
    name: 'read:users',
    createdAt: new Date(),
  };

  const mockPermissionsService = {
    findAllAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    permissionsService = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('permissions', () => {
    it('should return all permissions', async () => {
      mockPermissionsService.findAllAsync.mockResolvedValue([
        mockPermissionDto,
      ]);

      const result = await controller.permissions();

      expect(result).toEqual([mockPermissionDto]);
    });

    it('should throw BadRequestException on error', async () => {
      mockPermissionsService.findAllAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.permissions()).rejects.toThrow('Fetch failed');
    });
  });
});
