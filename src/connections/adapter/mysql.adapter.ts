import * as mysql from 'mysql2/promise';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class MysqlAdapter implements IDatabaseAdapter {
  private connector: mysql.Connection;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(MysqlAdapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      this.connector = await mysql.createConnection({
        host: this.connectionDto.server,
        port: this.connectionDto.port,
        user: this.connectionDto.user,
        password: this.connectionDto.password,
        database: this.connectionDto.database,
        connectTimeout: 60 * 60 * 1000,
      });
      this.logger.log('connected to mysql!');
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
      const [rows] = await this.connector.query({
        sql,
        values: params,
        timeout: timeOutMs,
      });
      return rows;
    } catch (error) {
      if (error?.code === 'ETIMEDOUT' || error?.errno === 3024) {
        this.logger.warn(`MySQL timed out after ${timeOutMs} ms.`);
        throw new DatabaseTimeOutError(timeOutMs);
      }

      if (error?.errno === 1213) {
        this.logger.warn(`MySQL Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.MySQL);
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

  public closeAsync = async (): Promise<boolean> => {
    try {
      await this.connector.end();
      this.logger.log('successfully closed connection!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };
}
