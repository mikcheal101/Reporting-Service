import { DatabaseType } from '../databasetype.enum';

export class ConnectionDto {
  id: number;
  name: string;
  server: string;
  port: number;
  user: string;
  password: string;
  database: string;
  isTestSuccessful: boolean;
  databaseType: DatabaseType;
  queryTimeout: number;
  cacheEnabled: boolean;
  cacheTtl: number;
  streamEnabled: boolean;
}
