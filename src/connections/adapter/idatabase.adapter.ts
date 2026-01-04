export interface IDatabaseAdapter {
  connect(): Promise<boolean>;
  query(sql: string, parameters: any): Promise<any>;
  close(): Promise<boolean>;
}
