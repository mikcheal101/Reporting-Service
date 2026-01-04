import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { ConnectionDto } from '../dto/connection.dto';
import { Connection } from '../entity/connections.entity';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConnectionUtils {
  private readonly logger: Logger;

  constructor(private readonly cryptoService: CryptoService) {
    this.logger = new Logger(ConnectionUtils.name);
  }

  public convertToDto(connection: Connection): ConnectionDto | undefined {
    if (connection === undefined) return undefined;
    try {
      return {
        id: connection.id,
        database: connection.database,
        isTestSuccessful: connection.isTestSuccessful,
        password: this.cryptoService.decrypt(connection.password),
        databaseType: connection.databaseType,
        name: connection.name,
        port: connection.port,
        server: connection.server,
        user: connection.user,
      };
    } catch (error) {
      this.logger.error(error.message, error.stack);
      return undefined;
    }
  }
}
