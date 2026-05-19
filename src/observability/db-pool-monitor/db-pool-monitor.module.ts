import { Module } from '@nestjs/common';
import { DbPoolMonitorService } from './db-pool-monitor.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [DbPoolMonitorService],
  exports: [DbPoolMonitorService],
})
export class DbPoolMonitorModule {}
