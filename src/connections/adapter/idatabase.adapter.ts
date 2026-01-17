export interface IDatabaseAdapter {
  connectAsync(): Promise<boolean>;
  queryAsync(sql: string, parameters: any, timeOutMs?: number): Promise<any>;
  closeAsync(): Promise<boolean>;
}
