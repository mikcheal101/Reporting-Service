import * as Firebird from 'node-firebird';
import { IDatabaseAdapter } from './idatabase.adapter';
import { ConnectionRequestDto } from '../dto/connection.request.dto';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';
import { Logger } from '@nestjs/common';
import DatabaseTimeOutError from 'src/common/errors/databasetimeout.error';
import DatabaseDeadLockError from 'src/common/errors/databasedeadlock.error';
import { DatabaseType } from '../databasetype.enum';

export class FirebirdAdapter implements IDatabaseAdapter {
  private connection: any;
  protected connectionDto: ConnectionRequestDto;
  private readonly logger: Logger;

  constructor(connectionRequestDto: ConnectionRequestDto) {
    this.connectionDto = connectionRequestDto;
    this.logger = new Logger(FirebirdAdapter.name);
  }

  public connectAsync = async (): Promise<boolean> => {
    try {
      const options: Firebird.Options = {
        host: this.connectionDto.server,
        port: this.connectionDto.port,
        database: this.connectionDto.database,
        user: this.connectionDto.user,
        password: this.connectionDto.password,
        lowercase_keys: false,
        role: null,
        pageSize: 4096,
      };
      this.connection = await new Promise((resolve, reject) => {
        Firebird.attach(options, (err, db) => {
          if (err) {
            reject(err);
          } else {
            resolve(db);
          }
        });
      });
      this.logger.log('connected to firebird!');
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
      const rows = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new DatabaseTimeOutError(timeOutMs));
        }, timeOutMs);
        this.connection.query(sql, params, (err, result) => {
          clearTimeout(timeoutId);
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      return rows;
    } catch (error) {
      if (error instanceof DatabaseTimeOutError) {
        this.logger.warn(`Firebird timed out after ${timeOutMs} ms.`);
        throw error;
      }

      // Firebird lock conflict
      if (error?.code === 335544345 || error?.code === 335544336) {
        this.logger.warn(`Firebird Deadlock detected!`);
        throw new DatabaseDeadLockError(DatabaseType.Firebird);
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
        await new Promise<void>((resolve, reject) => {
          this.connection.detach((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      this.logger.log('successfully closed connection!');
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  };
}
