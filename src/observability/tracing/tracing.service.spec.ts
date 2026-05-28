import { Test, TestingModule } from '@nestjs/testing';
import { TracingService } from './tracing.service';
import { ConfigService } from '@nestjs/config';

describe('TracingService', () => {
  let service: TracingService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TracingService>(TracingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not enable tracing without OTEL endpoint', () => {
    service.onModuleInit();
    const span = service.startSpan('test');
    expect(span).toBeNull();
  });

  it('should handle endSpan gracefully when null', () => {
    expect(() => service.endSpan(null)).not.toThrow();
  });

  it('should read OTEL config on init', () => {
    service.onModuleInit();
    expect(mockConfigService.get).toHaveBeenCalledWith(
      'OTEL_EXPORTER_OTLP_ENDPOINT',
    );
  });

  it('should handle OTEL SDK init failure gracefully when packages missing', () => {
    mockConfigService.get.mockReturnValue(
      'http://otel-collector:4318/v1/traces',
    );
    service.onModuleInit();
    const span = service.startSpan('test');
    expect(span).toBeNull();
  });
});
