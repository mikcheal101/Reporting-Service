import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let mockDataSource: { query: jest.Mock };

  beforeEach(async () => {
    mockDataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return healthy status when DB responds', async () => {
    mockDataSource.query.mockResolvedValue([{ 1: 1 }]);

    const result = await service.checkDatabase();
    expect(result).toEqual({
      database: { status: 'up' },
    });
  });

  it('should throw HealthCheckError when DB fails', async () => {
    mockDataSource.query.mockRejectedValue(new Error('DB unavailable'));

    await expect(service.checkDatabase()).rejects.toThrow();
  });
});
