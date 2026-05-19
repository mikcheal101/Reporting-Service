import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const mockDataSource = {
    query: jest.fn(),
    isInitialized: true,
  };

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check result', async () => {
    const expectedResult: HealthCheckResult = {
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    };
    mockHealthCheckService.check.mockResolvedValue(expectedResult);

    const result = await controller.check();
    expect(result).toEqual(expectedResult);
  });
});
