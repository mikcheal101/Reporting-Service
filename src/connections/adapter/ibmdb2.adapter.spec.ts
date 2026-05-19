jest.mock('ibm_db', () => ({
  open: jest.fn().mockResolvedValue({
    queryTimeout: jest.fn(),
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

import { IbmDb2Adapter } from './ibmdb2.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('IbmDb2Adapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: 'SAMPLE',
    databaseType: DatabaseType.IBMDb2,
    password: 'pass',
    port: 50000,
    server: 'localhost',
    user: 'db2inst1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new IbmDb2Adapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const ibmdb = require('ibm_db');
      ibmdb.open.mockRejectedValue(new Error('Connection refused'));

      const adapter = new IbmDb2Adapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow('Connection refused');
    });
  });

  describe('queryAsync', () => {
    let mockConn: any;

    beforeEach(() => {
      mockConn = {
        queryTimeout: jest.fn(),
        query: jest.fn().mockResolvedValue([{ id: 1 }]),
        close: jest.fn().mockResolvedValue(undefined),
      };
    });

    it('should execute query successfully', async () => {
      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockConn.queryTimeout).toHaveBeenCalledWith(60000);
      expect(mockConn.query).toHaveBeenCalledWith('SELECT * FROM users', []);
    });

    it('should bind parameters and execute query', async () => {
      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date('2024-01-01') },
      };
      await adapter.queryAsync('SELECT * FROM users WHERE name = ?', params);
      expect(mockConn.query).toHaveBeenCalledWith('SELECT * FROM users WHERE name = ?', [
        'test', 10, true, new Date('2024-01-01'),
      ]);
    });

    it('should re-throw query errors', async () => {
      mockConn.query.mockRejectedValue(new Error('Query failed'));

      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Query failed');
    });

    it('should throw DatabaseTimeOutError on ETIMEDOUT', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockConn.query.mockRejectedValue(timeoutError);

      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database query timed out');
    });

    it('should throw DatabaseDeadLockError on error 911', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).error = '911';
      mockConn.query.mockRejectedValue(deadlockError);

      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database Lock Detected!');
    });

    it('should throw DatabaseDeadLockError on sqlcode -911', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).sqlcode = -911;
      mockConn.query.mockRejectedValue(deadlockError);

      const adapter = new IbmDb2Adapter(connectionDto);
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
      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      const result = await adapter.closeAsync();
      expect(result).toBe(true);
      expect(mockConn.close).toHaveBeenCalled();
    });

    it('should throw error on close failure', async () => {
      mockConn.close.mockRejectedValue(new Error('Close failed'));

      const adapter = new IbmDb2Adapter(connectionDto);
      (adapter as any).connection = mockConn;

      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
