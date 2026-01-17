import * as mssql from 'mssql';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class MssqlAdapter implements IDatabaseAdapter {
  private connector: mssql.ConnectionPool;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(MssqlAdapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      this.connector = await new mssql.ConnectionPool({
        name: this.connectionDto.name,
        user: this.connectionDto.user,
        password: this.connectionDto.password,
        server: this.connectionDto.server,
        database: this.connectionDto.database,
        port: this.connectionDto.port,
        connectionTimeout: 60 * 60 * 1000, // 60 secs
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
      }).connect();
      this.logger.log('connected to mssql!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };

  public queryAsync = async (
    sql: string,
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
    timeOutMs: number = 60000, // 60 secs
  ): Promise<any> => {
    try {
      const request = this.bindParametersToQuery(
        this.connector.request(),
        parameters,
      );

      if (request === undefined) return undefined;

      // setting the timeout to an hour
      request.timeout = timeOutMs;

      const result = await request.query(sql);
      return result.recordset;
    } catch (error) {
      // Catch timeout error
      if (error?.code === 'ETIMEOUT') {
        this.logger.warn(`MSSQL timed out after {timeOutMs} ms.`);
        throw new DatabaseTimeOutError(timeOutMs);
      }

      // catch Deadlock error
      if (error?.number === 1205) {
        this.logger.warn(`MSSQL Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.MSSQL);
      }

      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  private readonly bindParametersToQuery = (
    request: mssql.Request,
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
  ): mssql.Request | undefined => {
    try {
      // bind the parameters
      Object.entries(parameters).forEach(([name, metadata]) => {
        switch (metadata.type) {
          case DatabaseDatatype.NUMBER:
            request.input(name, mssql.Int, metadata.value);
            break;

          case DatabaseDatatype.BOOLEAN:
            request.input(name, mssql.Bit, metadata.value);
            break;

          case DatabaseDatatype.DATE:
            request.input(name, mssql.DateTime, metadata.value);
            break;

          case DatabaseDatatype.STRING:
          default:
            request.input(name, mssql.VarChar, metadata.value);
            break;
        }
      });
      return request;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return undefined;
    }
  };

  public closeAsync = async (): Promise<boolean> => {
    try {
      await this.connector.close();
      this.logger.log('successfully closed connection!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };
}
