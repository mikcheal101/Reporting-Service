import * as oracledb from 'oracledb';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class OracleAdapter implements IDatabaseAdapter {
  private connection: oracledb.Connection;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(OracleAdapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      oracledb.fetchAsString = [oracledb.CLOB, oracledb.DATE];
      this.connection = await oracledb.getConnection({
        user: this.connectionDto.user,
        password: this.connectionDto.password,
        connectString: `${this.connectionDto.server}:${this.connectionDto.port}/${this.connectionDto.database}`,
      });
      this.logger.log('connected to oracle!');
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
      const binds = this.mapParameters(parameters);
      const result = await this.connection.execute(sql, binds, {
        maxRows: 10000,
        timeout: timeOutMs,
      });
      return result.rows;
    } catch (error) {
      if (error?.code === 'ETIMEDOUT' || error?.errorNum === 3135) {
        this.logger.warn(`Oracle timed out after ${timeOutMs} ms.`);
        throw new DatabaseTimeOutError(timeOutMs);
      }

      if (error?.errorNum === 60) {
        this.logger.warn(`Oracle Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.Oracle);
      }

      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  private readonly mapParameters = (
    parameters: Record<string, { type: DatabaseDatatype; value: any }> = {},
  ): any => {
    const binds: any = {};
    Object.entries(parameters).forEach(([name, metadata]) => {
      switch (metadata.type) {
        case DatabaseDatatype.NUMBER:
          binds[name] = Number(metadata.value);
          break;
        case DatabaseDatatype.BOOLEAN:
          binds[name] = Boolean(metadata.value);
          break;
        case DatabaseDatatype.DATE:
          binds[name] = new Date(metadata.value);
          break;
        case DatabaseDatatype.STRING:
        default:
          binds[name] = String(metadata.value);
          break;
      }
    });
    return binds;
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
