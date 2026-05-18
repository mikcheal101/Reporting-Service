jest.mock('mssql', () => {
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockResolvedValue({ recordset: [{ id: 1 }] }),
    timeout: 0,
  };
  const mockPool = {
    connect: jest.fn().mockResolvedValue(undefined),
    request: jest.fn().mockReturnValue(mockRequest),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const ConnectionPool = jest.fn().mockImplementation(() => mockPool);
  return {
    ConnectionPool,
    Int: { name: 'Int' },
    VarChar: { name: 'VarChar' },
    Bit: { name: 'Bit' },
    DateTime: { name: 'DateTime' },
  };
});

import { MssqlAdapter } from './mssql.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('MssqlAdapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: 'testdb',
    databaseType: DatabaseType.MSSQL,
    password: 'pass',
    port: 1433,
    server: 'localhost',
    user: 'sa',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new MssqlAdapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      mockPool.connect.mockRejectedValue(new Error('Connection refused'));

      const adapter = new MssqlAdapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('queryAsync', () => {
    it('should execute query successfully', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should bind parameters and execute query', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date() },
      };
      await adapter.queryAsync(
        'SELECT * FROM users WHERE name = @name',
        params,
      );
      expect(mockRequest.input).toHaveBeenCalledTimes(4);
    });

    it('should re-throw query errors', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Query failed',
      );
    });

    it('should throw DatabaseTimeOutError on ETIMEOUT', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEOUT';
      mockRequest.query.mockRejectedValue(timeoutError);

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Database query timed out',
      );
    });

    it('should throw DatabaseDeadLockError on deadlock (error 1205)', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).number = 1205;
      mockRequest.query.mockRejectedValue(deadlockError);

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow(
        'Database Lock Detected!',
      );
    });

    it('should return undefined when bindParametersToQuery fails', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      const mockRequest = mockPool.request();
      mockRequest.input = jest.fn().mockImplementation(() => {
        throw new Error('Input binding failed');
      });

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
      };
      const result = await adapter.queryAsync(
        'SELECT * FROM users WHERE name = @name',
        params,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('closeAsync', () => {
    it('should close connection successfully', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      mockPool.connect.mockResolvedValue(undefined);
      mockPool.close.mockResolvedValue(undefined);

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;
      const result = await adapter.closeAsync();
      expect(result).toBe(true);
    });

    it('should throw error on close failure', async () => {
      const mssql = require('mssql');
      const mockPool = mssql.ConnectionPool();
      mockPool.close.mockRejectedValue(new Error('Close failed'));

      const adapter = new MssqlAdapter(connectionDto);
      (adapter as any).connector = mockPool;
      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
