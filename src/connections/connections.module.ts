import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/common/security/crypto/crypto.module';
import { Connection } from './entity/connections.entity';
import { ConnectionUtils } from './utils/connection.utils';
import { QueryAnalyzerService } from './query-analyzer.service';
import { ConnectionPoolService } from './connection-pool.service';

@Module({
  imports: [TypeOrmModule.forFeature([Connection]), CryptoModule],
  providers: [
    ConnectionsService,
    ConnectionUtils,
    QueryAnalyzerService,
    ConnectionPoolService,
  ],
  controllers: [ConnectionsController],
  exports: [ConnectionsService, ConnectionPoolService],
})
export class ConnectionsModule {}
