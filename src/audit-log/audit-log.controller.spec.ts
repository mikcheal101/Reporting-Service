import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let service: AuditLogService;

  const mockService = {
    findAllAsync: jest.fn(),
    findOneAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockService,
        },
      ],
    }).overrideGuard(AuthGuard).useValue({ canActivate: jest.fn(() => true) }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    service = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all audit logs with filters', async () => {
    const mockResult = { data: [], total: 0 };
    mockService.findAllAsync.mockResolvedValue(mockResult);

    const result = await controller.findAll('users', 'POST', undefined, undefined, undefined, 1, 20);
    expect(result).toEqual(mockResult);
    expect(mockService.findAllAsync).toHaveBeenCalledWith({
      entity: 'users',
      action: 'POST',
      userId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('should handle errors with BadRequestException', async () => {
    mockService.findAllAsync.mockRejectedValue(new Error('Fetch failed'));

    await expect(
      controller.findAll(undefined, undefined, undefined, undefined, undefined, 1, 20),
    ).rejects.toThrow('Fetch failed');
  });

  it('should return a single audit log by id', async () => {
    const mockLog = { id: 1, action: 'POST' };
    mockService.findOneAsync.mockResolvedValue(mockLog);

    const result = await controller.findOne(1 as any);
    expect(result).toEqual(mockLog);
    expect(mockService.findOneAsync).toHaveBeenCalledWith(1);
  });

  it('should throw on invalid id', async () => {
    mockService.findOneAsync.mockRejectedValue(new Error('Not found'));

    await expect(controller.findOne(999 as any)).rejects.toThrow('Not found');
  });
});
