import * as ibmdb from 'ibm_db';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class IbmDb2Adapter implements IDatabaseAdapter {
  private connection: any;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(IbmDb2Adapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      const connStr = `DATABASE=${this.connectionDto.database};HOSTNAME=${this.connectionDto.server};PORT=${this.connectionDto.port};UID=${this.connectionDto.user};PWD=${this.connectionDto.password};`;
      this.connection = await ibmdb.open(connStr);
      this.logger.log('connected to ibm db2!');
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
      if (this.connection) {
        this.connection.queryTimeout(timeOutMs);
      }
      const params = this.mapParameters(parameters);
      const result = await this.connection.query(sql, params);
      return result;
    } catch (error) {
      if (error?.code === 'ETIMEDOUT') {
        this.logger.warn(`IBM Db2 timed out after ${timeOutMs} ms.`);
        throw new DatabaseTimeOutError(timeOutMs);
      }

      if (error?.error === '911' || error?.sqlcode === -911) {
        this.logger.warn(`IBM Db2 Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.IBMDb2);
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
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('successfully closed connection!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };
}
