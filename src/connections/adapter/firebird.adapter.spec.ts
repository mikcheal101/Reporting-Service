jest.mock('node-firebird', () => {
  const mockDb = {
    query: jest.fn((sql, params, callback) => {
      callback(null, [{ id: 1 }]);
    }),
    detach: jest.fn((callback) => {
      callback(null);
    }),
  };
  return {
    attach: jest.fn((options, callback) => {
      callback(null, mockDb);
    }),
  };
});

import { FirebirdAdapter } from './firebird.adapter';
import { DatabaseType } from '../databasetype.enum';
import { DatabaseDatatype } from 'src/common/models/database.datatypes.enum';

describe('FirebirdAdapter', () => {
  const connectionDto: any = {
    name: 'test',
    database: '/path/to/db.fdb',
    databaseType: DatabaseType.Firebird,
    password: 'pass',
    port: 3050,
    server: 'localhost',
    user: 'sysdba',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectAsync', () => {
    it('should connect successfully', async () => {
      const adapter = new FirebirdAdapter(connectionDto);
      const result = await adapter.connectAsync();
      expect(result).toBe(true);
    });

    it('should throw error on connection failure', async () => {
      const Firebird = require('node-firebird');
      Firebird.attach.mockImplementation((options, callback) => {
        callback(new Error('Connection refused'), null);
      });

      const adapter = new FirebirdAdapter(connectionDto);
      await expect(adapter.connectAsync()).rejects.toThrow('Connection refused');
    });
  });

  describe('queryAsync', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: jest.fn((sql, params, callback) => {
          callback(null, [{ id: 1 }]);
        }),
        detach: jest.fn((callback) => callback(null)),
      };
    });

    it('should execute query successfully', async () => {
      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      const result = await adapter.queryAsync('SELECT * FROM users');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users',
        [],
        expect.any(Function),
      );
    });

    it('should bind parameters and execute query', async () => {
      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      const params = {
        name: { type: DatabaseDatatype.STRING, value: 'test' },
        count: { type: DatabaseDatatype.NUMBER, value: 10 },
        active: { type: DatabaseDatatype.BOOLEAN, value: true },
        date: { type: DatabaseDatatype.DATE, value: new Date('2024-01-01') },
      };
      await adapter.queryAsync('SELECT * FROM users WHERE name = ?', params);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE name = ?',
        ['test', 10, true, new Date('2024-01-01')],
        expect.any(Function),
      );
    });

    it('should re-throw query errors', async () => {
      mockDb.query = jest.fn((sql, params, callback) => {
        callback(new Error('Query failed'), null);
      });

      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Query failed');
    });

    it('should throw DatabaseDeadLockError on code 335544345', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).code = 335544345;
      mockDb.query = jest.fn((sql, params, callback) => {
        callback(deadlockError, null);
      });

      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database Lock Detected!');
    });

    it('should throw DatabaseDeadLockError on code 335544336', async () => {
      const deadlockError = new Error('Deadlock');
      (deadlockError as any).code = 335544336;
      mockDb.query = jest.fn((sql, params, callback) => {
        callback(deadlockError, null);
      });

      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      await expect(adapter.queryAsync('SELECT * FROM users')).rejects.toThrow('Database Lock Detected!');
    });

    it('should throw DatabaseTimeOutError when timeout fires', async () => {
      mockDb.query = jest.fn((sql, params, callback) => {
        // never call callback - let timeout fire
      });

      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      await expect(
        adapter.queryAsync('SELECT * FROM users', {}, 10),
      ).rejects.toThrow('Database query timed out');
    }, 10000);
  });

  describe('closeAsync', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        detach: jest.fn((callback) => callback(null)),
      };
    });

    it('should close connection successfully', async () => {
      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      const result = await adapter.closeAsync();
      expect(result).toBe(true);
      expect(mockDb.detach).toHaveBeenCalled();
    });

    it('should throw error on close failure', async () => {
      mockDb.detach = jest.fn((callback) => callback(new Error('Close failed')));

      const adapter = new FirebirdAdapter(connectionDto);
      (adapter as any).connection = mockDb;

      await expect(adapter.closeAsync()).rejects.toThrow('Close failed');
    });
  });
});
