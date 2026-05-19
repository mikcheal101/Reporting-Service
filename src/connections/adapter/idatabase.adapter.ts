import { Readable } from 'node:stream';

export interface IDatabaseAdapter {
  connectAsync(): Promise<boolean>;
  queryAsync(sql: string, parameters?: any, timeOutMs?: number): Promise<any>;
  streamQueryAsync?(sql: string, parameters?: any, timeOutMs?: number): Readable;
  closeAsync(): Promise<boolean>;
}
