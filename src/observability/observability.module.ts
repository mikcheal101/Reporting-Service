import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { DbPoolMonitorModule } from './db-pool-monitor/db-pool-monitor.module';
import { TracingModule } from './tracing/tracing.module';

@Module({
  imports: [
    HealthModule,
    MetricsModule,
    CircuitBreakerModule,
    DbPoolMonitorModule,
    TracingModule,
  ],
  providers: [MetricsInterceptor, MetricsService],
  exports: [
    HealthModule,
    MetricsModule,
    CircuitBreakerModule,
    DbPoolMonitorModule,
    TracingModule,
    MetricsInterceptor,
  ],
})
export class ObservabilityModule {}
