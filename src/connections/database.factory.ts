import { IDatabaseAdapter } from './adapter/idatabase.adapter';
import { MssqlAdapter } from './adapter/mssql.adapter';
import { MysqlAdapter } from './adapter/mysql.adapter';
import { PostgresqlAdapter } from './adapter/postgresql.adapter';
import { MariaDBAdapter } from './adapter/mariadb.adapter';
import { OracleAdapter } from './adapter/oracle.adapter';
import { IbmDb2Adapter } from './adapter/ibmdb2.adapter';
import { FirebirdAdapter } from './adapter/firebird.adapter';
import { H2DatabaseAdapter } from './adapter/h2database.adapter';
import { DatabaseType } from './databasetype.enum';
import { ConnectionRequestDto } from './dto/connection.request.dto';

export class DatabaseFactory {
  public static readonly create = (
    connectionRequestDto: ConnectionRequestDto,
  ): IDatabaseAdapter => {
    switch (connectionRequestDto.databaseType) {
      case DatabaseType.MSSQL:
        return new MssqlAdapter(connectionRequestDto);
      case DatabaseType.MySQL:
        return new MysqlAdapter(connectionRequestDto);
      case DatabaseType.PostgreSQL:
        return new PostgresqlAdapter(connectionRequestDto);
      case DatabaseType.MariaDB:
        return new MariaDBAdapter(connectionRequestDto);
      case DatabaseType.Oracle:
        return new OracleAdapter(connectionRequestDto);
      case DatabaseType.IBMDb2:
        return new IbmDb2Adapter(connectionRequestDto);
      case DatabaseType.Firebird:
        return new FirebirdAdapter(connectionRequestDto);
      case DatabaseType.H2Database:
        return new H2DatabaseAdapter(connectionRequestDto);
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
      case DatabaseType.MySQL:
      case DatabaseType.MSSQL:
      case DatabaseType.MariaDB:
        return `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS;`;
      case DatabaseType.PostgreSQL:
        return `SELECT table_name, column_name, data_type FROM information_schema.columns;`;
      case DatabaseType.Oracle:
        return `SELECT table_name, column_name, data_type FROM all_tab_columns;`;
      case DatabaseType.IBMDb2:
        return `SELECT tabname AS table_name, colname AS column_name, typename AS data_type FROM syscat.columns;`;
      case DatabaseType.Firebird:
        return `SELECT rdb$relation_name AS table_name, rdb$field_name AS column_name, rdb$field_source AS data_type FROM rdb$relation_fields;`;
      case DatabaseType.H2Database:
        return `SELECT table_name, column_name, data_type FROM information_schema.columns;`;
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
      case DatabaseType.MariaDB:
      case DatabaseType.H2Database:
        return `SELECT * FROM (\n${query}\n) AS _limitedQuery LIMIT ${limit};`;
      case DatabaseType.Oracle:
      case DatabaseType.IBMDb2:
      case DatabaseType.Firebird:
        return `SELECT * FROM (\n${query}\n) WHERE ROWNUM <= ${limit};`;
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
      case DatabaseType.PostgreSQL:
        typeName = 'PostgreSQL';
        break;
      case DatabaseType.MariaDB:
        typeName = 'MariaDB';
        break;
      case DatabaseType.Oracle:
        typeName = 'Oracle';
        break;
      case DatabaseType.IBMDb2:
        typeName = 'IBM Db2';
        break;
      case DatabaseType.Firebird:
        typeName = 'Firebird';
        break;
      case DatabaseType.H2Database:
        typeName = 'H2';
        break;
      default:
        typeName = '';
        break;
    }
    return typeName;
  };
}
