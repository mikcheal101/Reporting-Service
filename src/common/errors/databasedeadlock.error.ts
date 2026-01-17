// common/errors/databasedeadlock.error.ts

import { DatabaseType } from 'src/connections/databasetype.enum';

class DatabaseDeadLockError extends Error {
  constructor(databaseType: DatabaseType) {
    super(`${databaseType.toString()}: Database Lock Detected!`);
    this.name = 'DatabaseDeadLockError';
  }
}

export default DatabaseDeadLockError;
