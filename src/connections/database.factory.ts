import { MssqlAdapter } from './adapter/mssql.adapter';
import { DatabaseType } from './databasetype.enum';
import { ConnectionRequestDto } from './dto/connection.request.dto';

export class DatabaseFactory {
  public static readonly create = (
    connectionRequestDto: ConnectionRequestDto,
  ): any => {
    switch (connectionRequestDto.databaseType) {
      case DatabaseType.MSSQL:
        return new MssqlAdapter(connectionRequestDto);
      default:
        throw new Error(
          `Database type ${connectionRequestDto.databaseType} not supported yet!`,
        );
    }
  };

  public static readonly getSchemaQueryForDatabase = (
    databaseType: DatabaseType,
  ): string => {
    switch (databaseType) {
      case DatabaseType.MSSQL:
        return `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS;`;
      default:
        throw new Error(`Database type ${databaseType} not supported yet!`);
    }
  };

  public static readonly wrapQueryWithLimit = (
    databaseType: DatabaseType,
    query: string,
    limit: number,
  ): string => {
    query = query.trim().replace(/;$/, '');
    switch (databaseType) {
      case DatabaseType.MSSQL:
        return `SELECT TOP (${limit}) * FROM (\n${query}\n) AS _limitedQuery;`;
      case DatabaseType.PostgreSQL:
      case DatabaseType.MySQL:
        return `SELECT * FROM (\n${query}\n) AS _limitedQuery LIMIT ${limit};`;
      default:
        throw new Error(`Database type ${databaseType} not supported yet!`);
    }
  };

  public static readonly deriveDatabaseName = (
    databaseType: DatabaseType,
  ): string => {
    let typeName: string;
    switch (databaseType) {
      case DatabaseType.MSSQL:
        typeName = 'MSSQL';
        break;
      case DatabaseType.MySQL:
        typeName = 'MySQL';
        break;
      default:
        typeName = '';
        break;
    }
    return typeName;
  };
}
