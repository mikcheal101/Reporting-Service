import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryGateway } from './query.gateway';
import { QueryStreamService } from './query-stream.service';
import { Connection } from 'src/connections/entity/connections.entity';
import { CryptoModule } from 'src/common/security/crypto/crypto.module';

@Module({
  imports: [TypeOrmModule.forFeature([Connection]), CryptoModule],
  providers: [QueryGateway, QueryStreamService],
  exports: [QueryGateway, QueryStreamService],
})
export class WebsocketModule {}
