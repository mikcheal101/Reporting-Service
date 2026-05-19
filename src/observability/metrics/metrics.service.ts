import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly register: promClient.Registry;

  constructor() {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });

    const metricRegisters = [this.register];

    this.register.registerMetric(
      new promClient.Gauge({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status'],
        registers: metricRegisters,
      }),
    );

    this.register.registerMetric(
      new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'route'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        registers: metricRegisters,
      }),
    );

    this.register.registerMetric(
      new promClient.Gauge({
        name: 'db_connection_pool_size',
        help: 'Database connection pool size',
        registers: metricRegisters,
      }),
    );

    this.register.registerMetric(
      new promClient.Gauge({
        name: 'db_connection_pool_active',
        help: 'Database connection pool active connections',
        registers: metricRegisters,
      }),
    );

    this.register.registerMetric(
      new promClient.Gauge({
        name: 'db_connection_pool_idle',
        help: 'Database connection pool idle connections',
        registers: metricRegisters,
      }),
    );
  }

  public async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  public getRegistry(): promClient.Registry {
    return this.register;
  }

  public incrementHttpRequests(method: string, route: string, status: number): void {
    const gauge = this.register.getSingleMetric('http_requests_total') as promClient.Gauge<string>;
    if (gauge) {
      gauge.inc({ method, route, status: String(status) });
    }
  }

  public observeHttpRequestDuration(method: string, route: string, seconds: number): void {
    const histogram = this.register.getSingleMetric('http_request_duration_seconds') as promClient.Histogram<string>;
    if (histogram) {
      histogram.observe({ method, route }, seconds);
    }
  }

  public setDbPoolSize(size: number): void {
    const gauge = this.register.getSingleMetric('db_connection_pool_size') as promClient.Gauge<string>;
    if (gauge) gauge.set(size);
  }

  public setDbPoolActive(active: number): void {
    const gauge = this.register.getSingleMetric('db_connection_pool_active') as promClient.Gauge<string>;
    if (gauge) gauge.set(active);
  }

  public setDbPoolIdle(idle: number): void {
    const gauge = this.register.getSingleMetric('db_connection_pool_idle') as promClient.Gauge<string>;
    if (gauge) gauge.set(idle);
  }

  onModuleDestroy(): void {
    this.register.clear();
  }
}
