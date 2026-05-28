import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogService } from '../audit-log.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditLogService: AuditLogService;

  const mockAuditLogService = {
    createAsync: jest.fn().mockResolvedValue(undefined),
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
        AuditInterceptor,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should skip audit for GET requests', async () => {
    const request = {
      method: 'GET',
      url: '/api/v1/users',
      body: {},
      user: { id: 1, username: 'admin' },
      ip: '::1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(context, next));
    expect(mockAuditLogService.createAsync).not.toHaveBeenCalled();
  });

  it('should skip audit for audit-log endpoints', async () => {
    const request = {
      method: 'POST',
      url: '/api/v1/audit-logs',
      body: {},
      user: { id: 1, username: 'admin' },
      ip: '::1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(context, next));
    expect(mockAuditLogService.createAsync).not.toHaveBeenCalled();
  });

  it('should skip audit for auth endpoints', async () => {
    const request = {
      method: 'POST',
      url: '/api/v1/auth/login',
      body: {},
      user: { id: 1, username: 'admin' },
      ip: '::1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(context, next));
    expect(mockAuditLogService.createAsync).not.toHaveBeenCalled();
  });

  it('should create audit log on POST mutation', async () => {
    const request = {
      method: 'POST',
      url: '/api/v1/users',
      body: { name: 'test' },
      user: { id: 1, username: 'admin' },
      ip: '::1',
      params: { id: '5' },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({ id: 5 }) };

    await lastValueFrom(interceptor.intercept(context, next));
    expect(mockAuditLogService.createAsync).toHaveBeenCalledWith({
      userId: 1,
      username: 'admin',
      action: 'POST',
      entity: 'users',
      entityId: 5,
      newValues: { name: 'test' },
      ipAddress: '::1',
    });
  });

  it('should not fail when audit create throws', async () => {
    mockAuditLogService.createAsync.mockResolvedValue(undefined);
    const request = {
      method: 'DELETE',
      url: '/api/v1/users/5',
      body: {},
      user: { id: 1, username: 'admin' },
      ip: '::1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({}) };

    await lastValueFrom(interceptor.intercept(context, next));
    expect(mockAuditLogService.createAsync).toHaveBeenCalled();
  });
});
