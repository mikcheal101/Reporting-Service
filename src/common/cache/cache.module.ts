import { Global, Module } from '@nestjs/common';
import { QueryCacheService } from './query-cache.service';

@Global()
@Module({
  providers: [QueryCacheService],
  exports: [QueryCacheService],
})
export class CacheModule {}
