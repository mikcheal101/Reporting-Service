import DatabaseDeadLockError from './databasedeadlock.error';
import { DatabaseType } from 'src/connections/databasetype.enum';

describe('DatabaseDeadLockError', () => {
  it('should create error with MSSQL type', () => {
    const error = new DatabaseDeadLockError(DatabaseType.MSSQL);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DatabaseDeadLockError');
    expect(error.message).toBe(
      `${DatabaseType.MSSQL}: Database Lock Detected!`,
    );
  });

  it('should include database type value in message', () => {
    const error = new DatabaseDeadLockError(DatabaseType.MySQL);
    expect(error.message).toBe(
      `${DatabaseType.MySQL}: Database Lock Detected!`,
    );
  });

  it('should be catchable as Error', () => {
    const error = new DatabaseDeadLockError(DatabaseType.MSSQL);
    try {
      throw error;
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toContain('Database Lock Detected!');
    }
  });
});
