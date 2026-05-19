jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[{ id: 1 }], null]),
    end: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { MariaDBAdapter } from './mariadb.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('MariaDBAdapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: 'testdb',
    databaseType: DatabaseType.MariaDB,
    password: 'pass',
    port: 3307,
    server: 'localhost',
    user: 'root',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new MariaDBAdapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const mysql = require('mysql2/promise');
      mysql.createConnection.mockRejectedValue(new Error('Connection refused'));

      const adapter = new MariaDBAdapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow('Connection refused');
    });
  });

  describe('queryAsync', () => {
    let mockConn: any;

    beforeEach(() => {
      mockConn = {
        query: jest.fn().mockResolvedValue([[{ id: 1 }], null]),
        end: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should execute query successfully', async () => {
      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockConn.query).toHaveBeenCalledWith({
        sql: 'SELECT * FROM users',
        values: [],
        timeout: 60000,
      });
    });

    it('should bind parameters and execute query', async () => {
      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date('2024-01-01') },
      };
      await adapter.queryAsync('SELECT * FROM users WHERE name = ?', params);
      expect(mockConn.query).toHaveBeenCalledWith({
        sql: 'SELECT * FROM users WHERE name = ?',
        values: ['test', 10, true, new Date('2024-01-01')],
        timeout: 60000,
      });
    });

    it('should re-throw query errors', async () => {
      mockConn.query.mockRejectedValue(new Error('Query failed'));

      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Query failed');
    });

    it('should throw DatabaseTimeOutError on ETIMEDOUT', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockConn.query.mockRejectedValue(timeoutError);

      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database query timed out');
    });

    it('should throw DatabaseTimeOutError on errno 3024', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).errno = 3024;
      mockConn.query.mockRejectedValue(timeoutError);

      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database query timed out');
    });

    it('should throw DatabaseDeadLockError on errno 1213', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).errno = 1213;
      mockConn.query.mockRejectedValue(deadlockError);

      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database Lock Detected!');
    });
  });

  describe('closeAsync', () => {
    let mockConn: any;

    beforeEach(() => {
      mockConn = { end: jest.fn().mockResolvedValue(undefined) };
    });

    it('should close connection successfully', async () => {
      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      const result = await adapter.closeAsync();
      expect(result).toBe(true);
      expect(mockConn.end).toHaveBeenCalled();
    });

    it('should throw error on close failure', async () => {
      mockConn.end.mockRejectedValue(new Error('Close failed'));

      const adapter = new MariaDBAdapter(connectionDto);
      (adapter as any).connector = mockConn;

      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
