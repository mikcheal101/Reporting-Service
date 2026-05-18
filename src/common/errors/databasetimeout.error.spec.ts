import DatabaseTimeOutError from './databasetimeout.error';

describe('DatabaseTimeOutError', () => {
  it('should create error with timeout message', () => {
    const error = new DatabaseTimeOutError(60000);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DatabaseTimeOutError');
    expect(error.message).toBe('Database query timed out after 60000 ms.');
  });

  it('should include custom timeout value', () => {
    const error = new DatabaseTimeOutError(30000);
    expect(error.message).toBe('Database query timed out after 30000 ms.');
  });

  it('should handle zero timeout', () => {
    const error = new DatabaseTimeOutError(0);
    expect(error.message).toBe('Database query timed out after 0 ms.');
  });

  it('should be catchable as Error', () => {
    const error = new DatabaseTimeOutError(5000);
    try {
      throw error;
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toContain('timed out');
    }
  });
});
