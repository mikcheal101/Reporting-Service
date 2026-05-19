import { Pool, types, Query, QueryResult } from 'pg';
import { Readable } from 'node:stream';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class PostgresqlAdapter implements IDatabaseAdapter {
  private pool: Pool;
  private client: any;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(PostgresqlAdapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      this.pool = new Pool({
        host: this.connectionDto.server,
        port: this.connectionDto.port,
        user: this.connectionDto.user,
        password: this.connectionDto.password,
        database: this.connectionDto.database,
        connectionTimeoutMillis: 60 * 1000,
      });
      this.client = await this.pool.connect();
      this.logger.log('connected to postgresql!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public queryAsync = async (
    sql: string,
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
    timeOutMs: number = 60000,
  ): Promise<any> => {
    try {
      const params = this.mapParameters(parameters);
      await this.client.query(`SET statement_timeout = ${timeOutMs}`);
      const result = await this.client.query({
        text: sql,
        values: params,
        types,
      });
      return result.rows;
    } catch (error) {
      if (error?.code === 'ETIMEDOUT' || error?.code === '57014') {
        this.logger.warn(`PostgreSQL timed out after ${timeOutMs} ms.`);
        throw new DatabaseTimeOutError(timeOutMs);
      }

      if (error?.code === '40P01') {
        this.logger.warn(`PostgreSQL Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.PostgreSQL);
      }

      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  private readonly mapParameters = (
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
  ): any[] => {
    return Object.values(parameters).map((metadata) => {
      switch (metadata.type) {
        case DatabaseDatatype.NUMBER:
          return Number(metadata.value);
        case DatabaseDatatype.BOOLEAN:
          return Boolean(metadata.value);
        case DatabaseDatatype.DATE:
          return new Date(metadata.value);
        case DatabaseDatatype.STRING:
        default:
          return String(metadata.value);
      }
    });
  };

  public streamQueryAsync = (
    sql: string,
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
    timeOutMs: number = 60000,
  ): Readable => {
    const params = this.mapParameters(parameters);
    this.client.query(`SET statement_timeout = ${timeOutMs}`);
    const query = new Query({ text: sql, values: params });
    const stream = this.client.query(query);
    return stream as Readable;
  };

  public closeAsync = async (): Promise<boolean> => {
    try {
      if (this.client) {
        this.client.release();
      }
      if (this.pool) {
        await this.pool.end();
      }
      this.logger.log('successfully closed connection!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };
}
