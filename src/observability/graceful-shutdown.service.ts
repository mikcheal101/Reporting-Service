import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down gracefully...');

    if (this.dataSource.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.logger.log('Database connection closed');
      } catch (error) {
        this.logger.error('Error closing database connection', error.stack);
      }
    }

    this.logger.log('Graceful shutdown complete');
  }
}
