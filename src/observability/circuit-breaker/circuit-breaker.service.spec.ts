import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CircuitBreakerPolicy } from 'cockatiel';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a breaker for a given key', () => {
    const breaker = service.getBreaker('test-db');
    expect(breaker).toBeDefined();
  });

  it('should return same breaker for same key', () => {
    const breaker1 = service.getBreaker('shared');
    const breaker2 = service.getBreaker('shared');
    expect(breaker1).toBe(breaker2);
  });

  it('should return Closed state for unknown keys', () => {
    expect(service.getState('unknown')).toBe('Closed');
  });

  it('should return states for all breakers', () => {
    service.getBreaker('db1');
    service.getBreaker('db2');
    const states = service.getAllStates();
    expect(states.db1).toBe('Closed');
    expect(states.db2).toBe('Closed');
  });

  it('should reset a breaker', () => {
    service.getBreaker('temp');
    expect(service.getState('temp')).toBe('Closed');
    service.resetBreaker('temp');
    expect(service.getState('temp')).toBe('Closed');
  });

  it('should execute a function through the breaker', async () => {
    const result = await service.execute('test-exec', async () => 'success');
    expect(result).toBe('success');
  });

  it('should reject when the function throws', async () => {
    await expect(
      service.execute('test-fail', async () => {
        throw new Error('fail');
      }),
    ).rejects.toThrow('fail');
  });

  it('should handle custom options', () => {
    const breaker = service.getBreaker('custom', {
      failureThreshold: 2,
      successThreshold: 1,
      halfOpenAfter: 1000,
    });
    expect(breaker).toBeDefined();
    expect(service.getState('custom')).toBe('Closed');
  });
});
