import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { UpdateConnectionResponseDto } from './dto/update-connection.response.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { DatabaseFactory } from './database.factory';
import { Connection } from './entity/connections.entity';
import { ConnectionTablesResponseDto } from './dto/connection-tables.response.dto';

@Injectable()
export class ConnectionsService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Connection)
    private readonly connectionsRepository: Repository<Connection>,
    private readonly cryptoService: CryptoService,
  ) {
    this.logger = new Logger(ConnectionsService.name);
  }

  public async testConnection(
    testConnectionDto: TestConnectionRequestDto,
  ): Promise<boolean> {
    try {
      const adapter = DatabaseFactory.create(testConnectionDto);
      return await adapter.connect();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public async getAllConnections(): Promise<Connection[]> {
    try {
      return await this.connectionsRepository.find();
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public async createConnection(
    connection: CreateConnectionRequestDto,
  ): Promise<boolean> {
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
        port: Number.parseInt(connection.port),
        user: connection.user,
        password: encryptedPassword,
        database: connection.database,
        databaseType: connection.databaseType,
        isTestSuccessful: connection.isTestSuccessful,
      });

      await this.connectionsRepository.save(newConnection);
      return true;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public async updateConnection(
    id: string,
    conn: UpdateConnectionRequestDto,
  ): Promise<UpdateConnectionResponseDto> {
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

      await this.connectionsRepository.save(connection);

      return { isUpdated: true };
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  public async getOneConnection(id: string): Promise<Connection> {
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

  public async getDecryptedConnection(id: number): Promise<Connection> {
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

  public async removeConnection(id: string): Promise<boolean> {
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

  public async getConnectionTables(
    id: number,
  ): Promise<ConnectionTablesResponseDto[]> {
    // get the connection and its details
    const connection = await this.connectionsRepository.findOneBy({ id });

    if (!connection) throw new Error('Unable to find specified connection!');

    const adapter = DatabaseFactory.create({
      name: connection.name,
      database: connection.database,
      databaseType: connection.databaseType,
      password: this.cryptoService.decrypt(connection.password),
      port: `${connection.port}`,
      server: connection.server,
      user: connection.user,
    });

    let connectionTablesResponseDto: ConnectionTablesResponseDto[] = [];

    try {
      await adapter.connect();
      const response = await adapter.query(
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

      console.log('query response: ', connectionTablesResponseDto);
      return connectionTablesResponseDto;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    } finally {
      await adapter.close();
    }
  }
}
