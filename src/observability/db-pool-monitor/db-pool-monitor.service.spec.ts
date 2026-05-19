import { Test, TestingModule } from '@nestjs/testing';
import { DbPoolMonitorService } from './db-pool-monitor.service';
import { MetricsService } from '../metrics/metrics.service';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('DbPoolMonitorService', () => {
  let service: DbPoolMonitorService;
  let metricsService: MetricsService;

  const mockMetricsService = {
    setDbPoolSize: jest.fn(),
    setDbPoolActive: jest.fn(),
    setDbPoolIdle: jest.fn(),
  };

  const mockPool = {
    size: 10,
    available: 7,
  };

  const mockDataSource = {
    isInitialized: true,
    driver: { pool: mockPool },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbPoolMonitorService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DbPoolMonitorService>(DbPoolMonitorService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should collect pool metrics', async () => {
    await service.collectPoolMetrics();
    expect(mockMetricsService.setDbPoolSize).toHaveBeenCalledWith(10);
    expect(mockMetricsService.setDbPoolActive).toHaveBeenCalledWith(3);
    expect(mockMetricsService.setDbPoolIdle).toHaveBeenCalledWith(7);
  });

  it('should return pool status', async () => {
    const status = await service.getPoolStatus();
    expect(status).toEqual({ size: 10, active: 3, idle: 7 });
  });

  it('should handle missing pool gracefully', async () => {
    const dsNoPool = {
      isInitialized: true,
      driver: {},
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbPoolMonitorService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: getDataSourceToken(),
          useValue: dsNoPool,
        },
      ],
    }).compile();

    const svc = module.get<DbPoolMonitorService>(DbPoolMonitorService);
    const status = await svc.getPoolStatus();
    expect(status).toEqual({ size: 0, active: 0, idle: 0 });
    svc.onModuleDestroy();
  });

  it('should handle uninitialized data source', async () => {
    const mockMetrics = {
      setDbPoolSize: jest.fn(),
      setDbPoolActive: jest.fn(),
      setDbPoolIdle: jest.fn(),
    };
    const dsUninit = {
      isInitialized: false,
      driver: { pool: { size: 10, available: 7 } },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbPoolMonitorService,
        {
          provide: MetricsService,
          useValue: mockMetrics,
        },
        {
          provide: getDataSourceToken(),
          useValue: dsUninit,
        },
      ],
    }).compile();

    const svc = module.get<DbPoolMonitorService>(DbPoolMonitorService);
    await svc.collectPoolMetrics();
    expect(mockMetrics.setDbPoolSize).not.toHaveBeenCalledWith(10);
    svc.onModuleDestroy();
  });

  it('should start collecting on init', () => {
    expect(mockMetricsService.setDbPoolSize).toHaveBeenCalled();
  });

  it('should handle pool with alternate naming (totalCount/idleCount)', async () => {
    const altPool = {
      totalCount: 20,
      idleCount: 15,
    };
    const dsAlt = {
      isInitialized: true,
      driver: { pool: altPool },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DbPoolMonitorService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: getDataSourceToken(),
          useValue: dsAlt,
        },
      ],
    }).compile();

    const svc = module.get<DbPoolMonitorService>(DbPoolMonitorService);
    const status = await svc.getPoolStatus();
    expect(status).toEqual({ size: 20, active: 5, idle: 15 });
    svc.onModuleDestroy();
  });
});
