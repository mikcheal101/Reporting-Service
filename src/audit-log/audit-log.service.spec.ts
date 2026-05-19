import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './entity/audit-log.entity';
import { Repository } from 'typeorm';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: Repository<AuditLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneByOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAsync', () => {
    it('should create an audit log entry', async () => {
      const input = {
        userId: 1,
        username: 'admin',
        action: 'POST',
        entity: 'users',
        entityId: 5,
        newValues: { name: 'test' },
        ipAddress: '127.0.0.1',
      };

      mockRepository.create.mockReturnValue(input);
      mockRepository.save.mockResolvedValue(input);

      await service.createAsync(input);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 1,
        username: 'admin',
        action: 'POST',
        entity: 'users',
        entityId: 5,
        details: '{"name":"test"}',
        ipAddress: '127.0.0.1',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle create without newValues', async () => {
      const input = {
        action: 'DELETE',
        entity: 'connections',
        userId: 2,
      };

      mockRepository.create.mockReturnValue(input);
      mockRepository.save.mockResolvedValue(input);

      await service.createAsync(input);

      expect(mockRepository.create).toHaveBeenCalledWith({
        action: 'DELETE',
        entity: 'connections',
        userId: 2,
        username: undefined,
        entityId: undefined,
        details: undefined,
        ipAddress: undefined,
      });
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.createAsync({ action: 'POST', entity: 'test' }),
      ).resolves.toBeUndefined();
    });
  });

  describe('findAllAsync', () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return paginated audit logs', async () => {
      const logs = [
        { id: 1, userId: 1, username: 'admin', action: 'POST', entity: 'users', entityId: 5, details: null, ipAddress: '::1', createdAt: new Date() },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([logs, 1]);

      const result = await service.findAllAsync({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].id).toBe(1);
    });

    it('should apply filters', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllAsync({
        entity: 'users',
        action: 'POST',
        userId: 1,
        from: '2024-01-01',
        to: '2024-12-31',
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should propagate errors', async () => {
      mockQueryBuilder.getManyAndCount.mockRejectedValue(new Error('Query failed'));

      await expect(
        service.findAllAsync({ page: 1, limit: 20 }),
      ).rejects.toThrow('Query failed');
    });
  });

  describe('findOneAsync', () => {
    it('should return a single audit log', async () => {
      const log = { id: 1, userId: 1, username: 'admin', action: 'POST', entity: 'users', entityId: 5, details: null, ipAddress: '::1', createdAt: new Date() };
      mockRepository.findOneByOrFail.mockResolvedValue(log);

      const result = await service.findOneAsync(1);
      expect(result.id).toBe(1);
    });

    it('should throw when not found', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(new Error('Not found'));

      await expect(service.findOneAsync(999)).rejects.toThrow('Not found');
    });
  });
});
