import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueryStreamService } from './query-stream.service';

interface ExecuteQueryMessage {
  connectionId: number;
  query: string;
  parameters?: string[];
  pageSize?: number;
}

@WebSocketGateway({
  namespace: '/query-stream',
  cors: { origin: '*', credentials: true },
})
export class QueryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeStreams = new Map<string, AbortController>();

  constructor(private readonly queryStreamService: QueryStreamService) {}

  handleConnection(client: Socket) {
    console.log(`Query client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const abort = this.activeStreams.get(client.id);
    if (abort) {
      abort.abort();
      this.activeStreams.delete(client.id);
    }
  }

  @SubscribeMessage('executeQuery')
  async handleExecuteQuery(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: ExecuteQueryMessage,
  ) {
    const abortController = new AbortController();
    this.activeStreams.set(client.id, abortController);

    try {
      client.emit('queryStatus', {
        status: 'running',
        message: 'Connecting to database...',
      });

      const connection = await this.queryStreamService.getConnection(
        message.connectionId,
      );
      if (!connection) {
        client.emit('queryError', {
          status: 'error',
          message: 'Connection not found',
        });
        return;
      }

      client.emit('queryStatus', {
        status: 'running',
        message: 'Executing query...',
      });

      const result = await this.queryStreamService.executeQuery(
        connection,
        message.query,
        message.parameters || [],
        message.pageSize || 100,
        abortController.signal,
      );

      client.emit('queryResult', {
        status: 'completed',
        data: result.data,
        totalRows: result.totalRows,
        executionTimeMs: result.executionTimeMs,
        columns: result.columns,
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        client.emit('queryStatus', {
          status: 'cancelled',
          message: 'Query cancelled',
        });
      } else {
        client.emit('queryError', {
          status: 'error',
          message: error.message || 'Query execution failed',
        });
      }
    } finally {
      this.activeStreams.delete(client.id);
    }
  }

  @SubscribeMessage('cancelQuery')
  handleCancelQuery(@ConnectedSocket() client: Socket) {
    const abort = this.activeStreams.get(client.id);
    if (abort) {
      abort.abort();
      this.activeStreams.delete(client.id);
      client.emit('queryStatus', {
        status: 'cancelled',
        message: 'Query cancelled',
      });
    }
  }
}
