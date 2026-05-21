import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection } from 'src/connections/entity/connections.entity';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { DatabaseFactory } from 'src/connections/database.factory';
import { QueryValidatorUtils } from 'src/common/utils/query-validator.utils';

export interface QueryStreamResult {
  data: any[];
  totalRows: number;
  executionTimeMs: number;
  columns: string[];
}

@Injectable()
export class QueryStreamService {
  private readonly logger = new Logger(QueryStreamService.name);

  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    private readonly cryptoService: CryptoService,
  ) {}

  async getConnection(connectionId: number): Promise<Connection | null> {
    return this.connectionRepository.findOne({ where: { id: connectionId } });
  }

  async executeQuery(
    connection: Connection,
    query: string,
    parameters: string[],
    pageSize: number,
    signal?: AbortSignal,
  ): Promise<QueryStreamResult> {
    const startTime = Date.now();

    QueryValidatorUtils.validateQuery(query);

    const decryptedPassword = this.cryptoService.decrypt(connection.password);
    const adapter = DatabaseFactory.create({
      name: connection.name,
      server: connection.server,
      port: connection.port,
      user: connection.user,
      password: decryptedPassword,
      database: connection.database,
      databaseType: connection.databaseType,
    });

    try {
      await adapter.connectAsync();

      if (signal?.aborted) {
        throw new Error('Query cancelled');
      }

      const result = await adapter.queryAsync(
        query,
        parameters.length > 0 ? parameters : undefined,
        connection.queryTimeout || 60000,
      );

      const executionTimeMs = Date.now() - startTime;
      const data = Array.isArray(result) ? result.slice(0, pageSize) : [];
      const columns = data.length > 0 ? Object.keys(data[0]) : [];

      return {
        data,
        totalRows: Array.isArray(result) ? result.length : 0,
        executionTimeMs,
        columns,
      };
    } finally {
      await adapter.closeAsync();
    }
  }
}
