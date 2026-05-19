// connections/connections.service.ts

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { DatabaseFactory } from './database.factory';
import { QueryCacheService } from 'src/common/cache/query-cache.service';
import { Connection } from './entity/connections.entity';
import { ConnectionTablesResponseDto } from './dto/connection-tables.response.dto';
import { ConnectionDto } from './dto/connection.dto';
import { ConnectionUtils } from './utils/connection.utils';
import { ERRORS } from '../common/constants/error-messages.constant';

@Injectable()
export class ConnectionsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Connection)
    private readonly connectionsRepository: Repository<Connection>,
    private readonly connectionUtils: ConnectionUtils,
    private readonly cryptoService: CryptoService,
    private readonly queryCache: QueryCacheService,
  ) {
    this.logger = new Logger(ConnectionsService.name);
  }

  public testConnectionAsync = async (
    testConnectionDto: TestConnectionRequestDto,
  ): Promise<boolean> => {
    try {
      const adapter = DatabaseFactory.create(testConnectionDto);
      return await adapter.connectAsync();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public connectionsAsync = async (userId?: number): Promise<Connection[]> => {
    try {
      let conns = userId
        ? await this.connectionsRepository.findBy({ userId })
        : await this.connectionsRepository.find();
      conns = conns.map((connection) => {
        connection.password = this.cryptoService.decrypt(connection.password);
        return connection;
      });
      return conns;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public createConnectionAsync = async (
    connection: CreateConnectionRequestDto,
    userId?: number,
  ): Promise<ConnectionDto> => {
    try {
      const exists = await this.connectionsRepository.findOneBy({
        name: connection.name,
      });
      if (exists) {
        throw new ConflictException(ERRORS.CONNECTION_NAME_EXISTS);
      }

      const encryptedPassword = this.cryptoService.encrypt(connection.password);

      const newConnection = this.connectionsRepository.create({
        name: connection.name,
        server: connection.server,
        port: connection.port,
        user: connection.user,
        password: encryptedPassword,
        database: connection.database,
        databaseType: connection.databaseType,
        isTestSuccessful: connection.isTestSuccessful,
        queryTimeout: connection.queryTimeout ?? 60000,
        cacheEnabled: connection.cacheEnabled ?? false,
        cacheTtl: connection.cacheTtl ?? 300,
        streamEnabled: connection.streamEnabled ?? false,
        description: connection.description,
        userId,
      });

      const savedConnection =
        await this.connectionsRepository.save(newConnection);

      return this.connectionUtils.convertToDto(savedConnection);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public updateConnectionAsync = async (
    id: string,
    conn: UpdateConnectionRequestDto,
    userId?: number,
  ): Promise<ConnectionDto> => {
    try {
      const where: any = { id: Number.parseInt(id) };
      if (userId) where.userId = userId;
      const connection = await this.connectionsRepository.findOneBy(where);
      if (!connection) {
        throw new NotFoundException(ERRORS.CONNECTION_NOT_FOUND);
      }

      if (conn.password) {
        conn.password = this.cryptoService.encrypt(conn.password);
      }

      // merge the two models
      Object.assign(connection, conn);

      const updatedConnection =
        await this.connectionsRepository.save(connection);

      this.queryCache.invalidate(updatedConnection.id);

      return this.connectionUtils.convertToDto(updatedConnection);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public getOneConnectionAsync = async (
    id: string,
    userId?: number,
  ): Promise<Connection> => {
    try {
      const where: any = { id: Number.parseInt(id) };
      if (userId) where.userId = userId;
      const connection = await this.connectionsRepository.findOneBy(where);
      return connection;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public getDecryptedConnectionAsync = async (
    id: number,
    userId?: number,
  ): Promise<Connection> => {
    try {
      const where: any = { id: id };
      if (userId) where.userId = userId;
      const connection = await this.connectionsRepository.findOneBy(where);
      if (connection) {
        connection.password = this.cryptoService.decrypt(connection.password);
      }
      return connection;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public removeConnectionAsync = async (
    id: string,
    userId?: number,
  ): Promise<boolean> => {
    try {
      const where: any = { id: Number.parseInt(id) };
      if (userId) where.userId = userId;
      const deleted = await this.connectionsRepository.delete(where);
      return deleted.affected > 0;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public getConnectionTablesAsync = async (
    id: number,
    userId?: number,
  ): Promise<ConnectionTablesResponseDto[]> => {
    // get the connection and its details
    const where: any = { id };
    if (userId) where.userId = userId;
    const connection = await this.connectionsRepository.findOneBy(where);

    if (!connection) throw new NotFoundException(ERRORS.CONNECTION_NOT_FOUND);

    const adapter = DatabaseFactory.create({
      name: connection.name,
      database: connection.database,
      databaseType: connection.databaseType,
      password: this.cryptoService.decrypt(connection.password),
      port: connection.port,
      server: connection.server,
      user: connection.user,
    });

    let connectionTablesResponseDto: ConnectionTablesResponseDto[] = [];

    try {
      await adapter.connectAsync();
      const response = await adapter.queryAsync(
        DatabaseFactory.getSchemaQueryForDatabase(connection.databaseType),
      );

      connectionTablesResponseDto = Object.values(
        response.reduce(
          (acc, row) => {
            if (!acc[row.TABLE_NAME]) {
              acc[row.TABLE_NAME] = {
                tableName: row.TABLE_NAME,
                columns: [],
              };
            }

            acc[row.TABLE_NAME].columns.push({
              columnName: row.COLUMN_NAME,
              dataType: row.DATA_TYPE,
            });

            return acc;
          },
          {} as Record<
            string,
            {
              tableName: string;
              columns: { columnName: string; dataType: string }[];
            }
          >,
        ),
      );
      return connectionTablesResponseDto;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    } finally {
      await adapter.closeAsync();
    }
  };
}
