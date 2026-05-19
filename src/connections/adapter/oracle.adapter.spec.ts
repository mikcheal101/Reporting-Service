jest.mock('oracledb', () => ({
  getConnection: jest.fn().mockResolvedValue({
    execute: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  CLOB: 'CLOB',
  DATE: 'DATE',
  fetchAsString: [],
  Int: 'INT',
  VarChar: 'VARCHAR',
}));

import { OracleAdapter } from './oracle.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('OracleAdapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: 'ORCL',
    databaseType: DatabaseType.Oracle,
    password: 'pass',
    port: 1521,
    server: 'localhost',
    user: 'system',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new OracleAdapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const oracledb = require('oracledb');
      oracledb.getConnection.mockRejectedValue(new Error('Connection refused'));

      const adapter = new OracleAdapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow('Connection refused');
    });
  });

  describe('queryAsync', () => {
    let mockConn: any;

    beforeEach(() => {
      mockConn = {
        execute: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
        close: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should execute query successfully', async () => {
      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockConn.execute).toHaveBeenCalledWith(
        'SELECT * FROM users',
        {},
        { maxRows: 10000, timeout: 60000 },
      );
    });

    it('should bind parameters and execute query', async () => {
      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date('2024-01-01') },
      };
      await adapter.queryAsync('SELECT * FROM users WHERE name = :name', params);
      expect(mockConn.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE name = :name',
        {
          name: 'test',
          count: 10,
          active: true,
          date: new Date('2024-01-01'),
        },
        { maxRows: 10000, timeout: 60000 },
      );
    });

    it('should re-throw query errors', async () => {
      mockConn.execute.mockRejectedValue(new Error('Query failed'));

      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Query failed');
    });

    it('should throw DatabaseTimeOutError on ETIMEDOUT', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockConn.execute.mockRejectedValue(timeoutError);

      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database query timed out');
    });

    it('should throw DatabaseTimeOutError on errorNum 3135', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).errorNum = 3135;
      mockConn.execute.mockRejectedValue(timeoutError);

      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database query timed out');
    });

    it('should throw DatabaseDeadLockError on errorNum 60', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).errorNum = 60;
      mockConn.execute.mockRejectedValue(deadlockError);

      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database Lock Detected!');
    });
  });

  describe('closeAsync', () => {
    let mockConn: any;

    beforeEach(() => {
      mockConn = { close: jest.fn().mockResolvedValue(undefined) };
    });

    it('should close connection successfully', async () => {
      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      const result = await adapter.closeAsync();
      expect(result).toBe(true);
      expect(mockConn.close).toHaveBeenCalled();
    });

    it('should throw error on close failure', async () => {
      mockConn.close.mockRejectedValue(new Error('Close failed'));

      const adapter = new OracleAdapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
