import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return prometheus formatted metrics', async () => {
    const metrics = await service.getMetrics();
    expect(metrics).toContain('http_requests_total');
    expect(metrics).toContain('http_request_duration_seconds');
    expect(metrics).toContain('db_connection_pool_size');
  });

  it('should increment http requests counter', () => {
    expect(() => service.incrementHttpRequests('GET', '/api/v1/health', 200)).not.toThrow();
  });

  it('should observe http request duration', () => {
    expect(() => service.observeHttpRequestDuration('GET', '/api/v1/health', 0.1)).not.toThrow();
  });

  it('should set db pool metrics', () => {
    expect(() => service.setDbPoolSize(10)).not.toThrow();
    expect(() => service.setDbPoolActive(5)).not.toThrow();
    expect(() => service.setDbPoolIdle(5)).not.toThrow();
  });

  it('should clear registry on destroy', () => {
    expect(() => service.onModuleDestroy()).not.toThrow();
  });

  it('should return registry', () => {
    const registry = service.getRegistry();
    expect(registry).toBeDefined();
    expect(registry.metrics).toBeDefined();
  });
});
