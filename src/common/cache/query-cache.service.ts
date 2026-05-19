import { Injectable, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';
import { createHash } from 'node:crypto';

@Injectable()
export class QueryCacheService {
  private readonly cache: NodeCache;
  private readonly logger: Logger;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    this.logger = new Logger(QueryCacheService.name);
  }

  public buildKey(
    connectionId: number,
    queryString: string,
    parameters?: any,
  ): string {
    const raw = `${connectionId}|${queryString}|${JSON.stringify(parameters || {})}`;
    return createHash('md5').update(raw).digest('hex');
  }

  public get<T>(key: string): T | undefined {
    const cached = this.cache.get<T>(key);
    if (cached) {
      this.logger.log(`Cache hit for key ${key}`);
    }
    return cached;
  }

  public set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value, ttl);
    this.logger.log(`Cache set for key ${key}`);
  }

  public invalidate(connectionId?: number): void {
    if (connectionId) {
      const keys = this.cache.keys();
      for (const key of keys) {
        if (key.startsWith(`${connectionId}|`)) {
          this.cache.del(key);
        }
      }
      this.logger.log(`Cache invalidated for connection ${connectionId}`);
    } else {
      this.cache.flushAll();
      this.logger.log('Cache flushed entirely');
    }
  }

  public getStats() {
    return this.cache.getStats();
  }
}
