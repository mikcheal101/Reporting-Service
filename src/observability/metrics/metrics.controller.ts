import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('api/v1/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  public async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
