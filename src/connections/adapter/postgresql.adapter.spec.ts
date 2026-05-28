jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
    release: jest.fn(),
  };
  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    end: jest.fn().mockResolvedValue(undefined),
  };
  const Pool = jest.fn().mockImplementation(() => mockPool);
  return { Pool, types: { builtins: {} } };
});

import { PostgresqlAdapter } from './postgresql.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('PostgresqlAdapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: 'testdb',
    databaseType: DatabaseType.PostgreSQL,
    password: 'pass',
    port: 5432,
    server: 'localhost',
    user: 'postgres',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new PostgresqlAdapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const pg = require('pg');
      const mockPool = pg.Pool();
      mockPool.connect.mockRejectedValue(new Error('Connection refused'));

      const adapter = new PostgresqlAdapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('queryAsync', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
        release: jest.fn(),
      };
    });

    it('should execute query successfully', async () => {
      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'SELECT * FROM users',
        values: [],
        types: expect.any(Object),
      });
    });

    it('should bind parameters and execute query', async () => {
      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date('2024-01-01') },
      };
      await adapter.queryAsync('SELECT * FROM users WHERE name = $1', params);
      expect(mockClient.query).toHaveBeenCalledWith({
        text: 'SELECT * FROM users WHERE name = $1',
        values: ['test', 10, true, new Date('2024-01-01')],
        types: expect.any(Object),
      });
    });

    it('should re-throw query errors', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Query failed',
      );
    });

    it('should throw DatabaseTimeOutError on ETIMEDOUT', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockClient.query.mockRejectedValue(timeoutError);

      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Database query timed out',
      );
    });

    it('should throw DatabaseTimeOutError on code 57014', async () => {
      const timeoutError = new Error('Query cancelled');
      (timeoutError as any).code = '57014';
      mockClient.query.mockRejectedValue(timeoutError);

      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Database query timed out',
      );
    });

    it('should throw DatabaseDeadLockError on code 40P01', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).code = '40P01';
      mockClient.query.mockRejectedValue(deadlockError);

      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Database Lock Detected!',
      );
    });
  });

  describe('closeAsync', () => {
    let mockClient: any;
    let mockPool: any;

    beforeEach(() => {
      mockClient = { release: jest.fn() };
      mockPool = { end: jest.fn().mockResolvedValue(undefined) };
    });

    it('should close connection successfully', async () => {
      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;
      (adapter as any).pool = mockPool;

      const result = await adapter.closeAsync();
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should throw error on close failure', async () => {
      mockPool.end.mockRejectedValue(new Error('Close failed'));

      const adapter = new PostgresqlAdapter(connectionDto);
      (adapter as any).client = mockClient;
      (adapter as any).pool = mockPool;

      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
