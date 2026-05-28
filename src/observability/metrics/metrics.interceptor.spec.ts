import { Test, TestingModule } from '@nestjs/testing';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('MetricsInterceptor', () => {
  let interceptor: MetricsInterceptor;
  let metricsService: MetricsService;

  const mockMetricsService = {
    incrementHttpRequests: jest.fn(),
    observeHttpRequestDuration: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsInterceptor,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should record metrics on success', (done) => {
    const mockRequest = {
      method: 'GET',
      url: '/api/v1/health',
      route: { path: '/api/v1/health' },
    };
    const mockResponse = { statusCode: 200 };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({}) };

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(mockMetricsService.incrementHttpRequests).toHaveBeenCalledWith(
          'GET',
          '/api/v1/health',
          200,
        );
        expect(
          mockMetricsService.observeHttpRequestDuration,
        ).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should record metrics on error', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/users',
      route: { path: '/api/v1/users' },
    };
    const mockResponse = { statusCode: 500 };
    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;
    const next: CallHandler = {
      handle: () => throwError(() => new Error('test')),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(mockMetricsService.incrementHttpRequests).toHaveBeenCalledWith(
          'POST',
          '/api/v1/users',
          500,
        );
        expect(
          mockMetricsService.observeHttpRequestDuration,
        ).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should resolve route to known prefix', () => {
    expect(interceptor['resolveRoute']('/api/v1/health')).toBe(
      '/api/v1/health',
    );
    expect(interceptor['resolveRoute']('/api/v1/auth/login')).toBe(
      '/api/v1/auth',
    );
  });
});
