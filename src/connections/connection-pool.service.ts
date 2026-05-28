import { Injectable, Logger } from '@nestjs/common';
import { DatabaseType } from './databasetype.enum';

interface PoolEntry {
  pool: any;
  config: string;
  createdAt: Date;
  lastUsedAt: Date;
  useCount: number;
}

@Injectable()
export class ConnectionPoolService {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private pools = new Map<string, PoolEntry>();
  private readonly maxIdleMinutes = 30;

  getPoolKey(
    type: DatabaseType,
    server: string,
    port: number,
    database: string,
  ): string {
    return `${type}-${server}-${port}-${database}`;
  }

  registerPool(key: string, pool: any): void {
    this.pools.set(key, {
      pool,
      config: key,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      useCount: 0,
    });
  }

  getPool(key: string): any | undefined {
    const entry = this.pools.get(key);
    if (entry) {
      entry.lastUsedAt = new Date();
      entry.useCount++;
      return entry.pool;
    }
    return undefined;
  }

  removePool(key: string): void {
    const entry = this.pools.get(key);
    if (entry) {
      this.pools.delete(key);
    }
  }

  getPoolCount(): number {
    return this.pools.size;
  }

  getStats(): {
    key: string;
    useCount: number;
    ageMinutes: number;
    idleMinutes: number;
  }[] {
    const now = new Date();
    return Array.from(this.pools.entries()).map(([key, entry]) => ({
      key,
      useCount: entry.useCount,
      ageMinutes: Math.round(
        (now.getTime() - entry.createdAt.getTime()) / 60000,
      ),
      idleMinutes: Math.round(
        (now.getTime() - entry.lastUsedAt.getTime()) / 60000,
      ),
    }));
  }

  drainIdlePools(): number {
    const now = new Date();
    let drained = 0;
    for (const [key, entry] of this.pools.entries()) {
      const idleMinutes = (now.getTime() - entry.lastUsedAt.getTime()) / 60000;
      if (idleMinutes > this.maxIdleMinutes) {
        try {
          if (entry.pool && typeof entry.pool.close === 'function') {
            entry.pool.close();
          } else if (entry.pool && typeof entry.pool.end === 'function') {
            entry.pool.end();
          }
        } catch (err) {
          this.logger.warn(`Error closing pool ${key}: ${err.message}`);
        }
        this.pools.delete(key);
        drained++;
      }
    }
    return drained;
  }

  drainAll(): number {
    let drained = 0;
    for (const [key, entry] of this.pools.entries()) {
      try {
        if (entry.pool && typeof entry.pool.close === 'function') {
          entry.pool.close();
        } else if (entry.pool && typeof entry.pool.end === 'function') {
          entry.pool.end();
        }
      } catch (err) {
        this.logger.warn(`Error closing pool ${key}: ${err.message}`);
      }
      this.pools.delete(key);
      drained++;
    }
    return drained;
  }
}
