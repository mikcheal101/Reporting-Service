import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityModule } from './observability.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { DbPoolMonitorModule } from './db-pool-monitor/db-pool-monitor.module';
import { TracingModule } from './tracing/tracing.module';

describe('ObservabilityModule', () => {
  it('should be defined', () => {
    const module = new ObservabilityModule();
    expect(module).toBeDefined();
  });
});
