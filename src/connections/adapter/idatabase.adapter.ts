export interface IDatabaseAdapter {
  connectAsync(): Promise<boolean>;
  queryAsync(sql: string, parameters: any): Promise<any>;
  closeAsync(): Promise<boolean>;
}
