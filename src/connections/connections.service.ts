// connections/connections.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { DatabaseFactory } from './database.factory';
import { Connection } from './entity/connections.entity';
import { ConnectionTablesResponseDto } from './dto/connection-tables.response.dto';
import { ConnectionDto } from './dto/connection.dto';
import { ConnectionUtils } from './utils/connection.utils';

@Injectable()
export class ConnectionsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Connection)
    private readonly connectionsRepository: Repository<Connection>,
    private readonly connectionUtils: ConnectionUtils,
    private readonly cryptoService: CryptoService,
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
      throw new Error(error.message);
    }
  }

  public connectionsAsync = async(): Promise<Connection[]> => {
    try {
      let conns = await this.connectionsRepository.find();
      conns = conns.map((connection) => {
        connection.password = this.cryptoService.decrypt(connection.password);
        return connection;
      });
      return conns;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public createConnectionAsync = async (
    connection: CreateConnectionRequestDto,
  ): Promise<ConnectionDto> => {
    try {
      const exists = await this.connectionsRepository.findOneBy({
        name: connection.name,
      });
      if (exists) {
        throw new Error('Connection already exists!');
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
      });

      const savedConnection =
        await this.connectionsRepository.save(newConnection);

      return this.connectionUtils.convertToDto(savedConnection);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public updateConnectionAsync = async (
    id: string,
    conn: UpdateConnectionRequestDto,
  ): Promise<ConnectionDto> => {
    try {
      const connection = await this.connectionsRepository.findOneBy({
        id: Number.parseInt(id),
      });
      if (!connection) {
        throw new Error('Unable to find specified connection!');
      }

      if (conn.password) {
        conn.password = this.cryptoService.encrypt(conn.password);
      }

      // merge the two models
      Object.assign(connection, conn);

      const updatedConnection =
        await this.connectionsRepository.save(connection);

      return this.connectionUtils.convertToDto(updatedConnection);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public getOneConnectionAsync = async (id: string): Promise<Connection> => {
    try {
      const connection = await this.connectionsRepository.findOneBy({
        id: Number.parseInt(id),
      });
      return connection;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public getDecryptedConnectionAsync = async (id: number): Promise<Connection> => {
    try {
      const connection = await this.connectionsRepository.findOneBy({
        id: id,
      });
      if (connection) {
        connection.password = this.cryptoService.decrypt(connection.password);
      }
      return connection;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public removeConnectionAsync = async (id: string): Promise<boolean> => {
    try {
      const deleted = await this.connectionsRepository.delete({
        id: Number.parseInt(id),
      });
      return deleted.affected > 0;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public getConnectionTablesAsync = async (
    id: number,
  ): Promise<ConnectionTablesResponseDto[]> => {
    // get the connection and its details
    const connection = await this.connectionsRepository.findOneBy({ id });

    if (!connection) throw new Error('Unable to find specified connection!');

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
      throw new Error(error.message);
    } finally {
      await adapter.closeAsync();
    }
  }
}
