import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class DbPoolMonitorService implements OnModuleInit {
  private readonly logger = new Logger(DbPoolMonitorService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit(): void {
    this.collectPoolMetrics();
    this.intervalHandle = setInterval(() => this.collectPoolMetrics(), 15000);
  }

  public async collectPoolMetrics(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) return;

      const pool = (this.dataSource.driver as unknown as Record<string, unknown>).pool;
      if (!pool) return;

      const poolAny = pool as Record<string, unknown>;
      const size = typeof poolAny.size === 'number' ? poolAny.size : typeof poolAny.totalCount === 'number' ? poolAny.totalCount : 0;
      const available = typeof poolAny.available === 'number' ? poolAny.available : typeof poolAny.idleCount === 'number' ? poolAny.idleCount : 0;
      const active = size - available;

      this.metricsService.setDbPoolSize(size);
      this.metricsService.setDbPoolActive(active);
      this.metricsService.setDbPoolIdle(available);
    } catch (error) {
      this.logger.error('Failed to collect DB pool metrics', error.stack);
    }
  }

  public async getPoolStatus(): Promise<Record<string, number>> {
    const pool = (this.dataSource.driver as unknown as Record<string, unknown>).pool;
    if (!pool) return { size: 0, active: 0, idle: 0 };

    const poolAny = pool as Record<string, unknown>;
    const size = typeof poolAny.size === 'number' ? poolAny.size : typeof poolAny.totalCount === 'number' ? poolAny.totalCount : 0;
    const available = typeof poolAny.available === 'number' ? poolAny.available : typeof poolAny.idleCount === 'number' ? poolAny.idleCount : 0;
    return { size, active: size - available, idle: available };
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
