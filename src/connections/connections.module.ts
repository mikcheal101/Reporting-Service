import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/common/security/crypto/crypto.module';
import { Connection } from './entity/connections.entity';
import { ConnectionUtils } from './utils/connection.utils';

@Module({
  imports: [TypeOrmModule.forFeature([Connection]), CryptoModule],
  providers: [ConnectionsService, ConnectionUtils],
  controllers: [ConnectionsController],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}
