import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let metricsService: MetricsService;

  const mockMetricsService = {
    getMetrics: jest.fn().mockResolvedValue('# HELP http_requests_total\n'),
    getRegistry: jest.fn(),
    incrementHttpRequests: jest.fn(),
    observeHttpRequestDuration: jest.fn(),
    setDbPoolSize: jest.fn(),
    setDbPoolActive: jest.fn(),
    setDbPoolIdle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return prometheus metrics', async () => {
    const result = await controller.getMetrics();
    expect(result).toContain('http_requests_total');
    expect(mockMetricsService.getMetrics).toHaveBeenCalled();
  });
});
