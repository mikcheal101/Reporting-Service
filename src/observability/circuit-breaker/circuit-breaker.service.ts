import { Injectable, Logger } from '@nestjs/common';
import {
  circuitBreaker,
  CircuitBreakerPolicy,
  handleAll,
  wrap,
  SamplingBreaker,
} from 'cockatiel';
import {
  retry as retryPolicy,
  handleType,
  TimeoutStrategy,
  timeout as timeoutPolicy,
} from 'cockatiel';

export interface CircuitBreakerOptions {
  halfOpenAfter: number;
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  samplingWindowMs: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers: Map<string, CircuitBreakerPolicy> = new Map();

  private readonly defaultOptions: CircuitBreakerOptions = {
    halfOpenAfter: 30000,
    failureThreshold: 5,
    successThreshold: 3,
    timeoutMs: 10000,
    samplingWindowMs: 60000,
  };

  public getBreaker(
    key: string,
    options?: Partial<CircuitBreakerOptions>,
  ): CircuitBreakerPolicy {
    const existing = this.breakers.get(key);
    if (existing) return existing;

    const opts = { ...this.defaultOptions, ...options };
    const breaker = circuitBreaker(handleAll, {
      breaker: new SamplingBreaker({
        threshold: 1 / opts.failureThreshold,
        duration: opts.samplingWindowMs,
      }),
      halfOpenAfter: opts.halfOpenAfter,
    });

    breaker.onBreak(() =>
      this.logger.warn(
        `Circuit breaker [${key}] OPEN — requests will be rejected`,
      ),
    );
    breaker.onHalfOpen(() =>
      this.logger.log(`Circuit breaker [${key}] HALF-OPEN — testing recovery`),
    );
    breaker.onReset(() =>
      this.logger.log(`Circuit breaker [${key}] CLOSED —恢复正常`),
    );

    this.breakers.set(key, breaker);
    return breaker;
  }

  public async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(key);
    const retry = retryPolicy(handleType(Error), { maxAttempts: 1 });
    const timeout = timeoutPolicy(
      this.defaultOptions.timeoutMs,
      TimeoutStrategy.Aggressive,
    );

    const combined = wrap(timeout, breaker, retry);
    return combined.execute(() => fn());
  }

  public getState(key: string): string {
    const breaker = this.breakers.get(key);
    if (!breaker) return 'Closed';

    switch (breaker.state) {
      case 0:
        return 'Closed';
      case 1:
        return 'Open';
      case 2:
        return 'HalfOpen';
      case 3:
        return 'Isolated';
      default:
        return 'Unknown';
    }
  }

  public getAllStates(): Record<string, string> {
    const states: Record<string, string> = {};
    for (const [key] of this.breakers) {
      states[key] = this.getState(key);
    }
    return states;
  }

  public resetBreaker(key: string): void {
    const breaker = this.breakers.get(key);
    if (breaker) {
      this.logger.log(`Resetting circuit breaker [${key}]`);
      this.breakers.delete(key);
    }
  }
}
