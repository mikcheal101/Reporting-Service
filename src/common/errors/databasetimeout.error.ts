// common/errors/databasetimeout.error.ts

class DatabaseTimeOutError extends Error {
  constructor(timeOutMs: number) {
    super(`Database query timed out after ${timeOutMs} ms.`);
    this.name = 'DatabaseTimeOutError';
  }
}

export default DatabaseTimeOutError;
