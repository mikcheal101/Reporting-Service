import { DatabaseFactory } from './database.factory';
import { DatabaseType } from './databasetype.enum';
import { MssqlAdapter } from './adapter/mssql.adapter';
import { MysqlAdapter } from './adapter/mysql.adapter';
import { PostgresqlAdapter } from './adapter/postgresql.adapter';
import { MariaDBAdapter } from './adapter/mariadb.adapter';
import { OracleAdapter } from './adapter/oracle.adapter';
import { IbmDb2Adapter } from './adapter/ibmdb2.adapter';
import { FirebirdAdapter } from './adapter/firebird.adapter';
import { H2DatabaseAdapter } from './adapter/h2database.adapter';

jest.mock('./adapter/mssql.adapter');
jest.mock('./adapter/mysql.adapter');
jest.mock('./adapter/postgresql.adapter');
jest.mock('./adapter/mariadb.adapter');
jest.mock('./adapter/oracle.adapter');
jest.mock('./adapter/ibmdb2.adapter');
jest.mock('./adapter/firebird.adapter');
jest.mock('./adapter/h2database.adapter');

describe('DatabaseFactory', () => {
  describe('create', () => {
    const connectionDto: any = {
      name: 'test',
      database: 'testdb',
      databaseType: DatabaseType.MSSQL,
      password: 'pass',
      port: 1433,
      server: 'localhost',
      user: 'sa',
    };

    it('should create MssqlAdapter for MSSQL', () => {
      const adapter = DatabaseFactory.create(connectionDto);
      expect(adapter).toBeInstanceOf(MssqlAdapter);
      expect(MssqlAdapter).toHaveBeenCalledWith(connectionDto);
    });

    it('should create MysqlAdapter for MySQL', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.MySQL,
      });
      expect(adapter).toBeInstanceOf(MysqlAdapter);
      expect(MysqlAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.MySQL }),
      );
    });

    it('should create PostgresqlAdapter for PostgreSQL', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.PostgreSQL,
      });
      expect(adapter).toBeInstanceOf(PostgresqlAdapter);
      expect(PostgresqlAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.PostgreSQL }),
      );
    });

    it('should create MariaDBAdapter for MariaDB', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.MariaDB,
      });
      expect(adapter).toBeInstanceOf(MariaDBAdapter);
      expect(MariaDBAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.MariaDB }),
      );
    });

    it('should create OracleAdapter for Oracle', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.Oracle,
      });
      expect(adapter).toBeInstanceOf(OracleAdapter);
      expect(OracleAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.Oracle }),
      );
    });

    it('should create IbmDb2Adapter for IBMDb2', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.IBMDb2,
      });
      expect(adapter).toBeInstanceOf(IbmDb2Adapter);
      expect(IbmDb2Adapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.IBMDb2 }),
      );
    });

    it('should create FirebirdAdapter for Firebird', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.Firebird,
      });
      expect(adapter).toBeInstanceOf(FirebirdAdapter);
      expect(FirebirdAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.Firebird }),
      );
    });

    it('should create H2DatabaseAdapter for H2Database', () => {
      const adapter = DatabaseFactory.create({
        ...connectionDto,
        databaseType: DatabaseType.H2Database,
      });
      expect(adapter).toBeInstanceOf(H2DatabaseAdapter);
      expect(H2DatabaseAdapter).toHaveBeenCalledWith(
        expect.objectContaining({ databaseType: DatabaseType.H2Database }),
      );
    });

    it('should throw for unsupported database type', () => {
      expect(() =>
        DatabaseFactory.create({ ...connectionDto, databaseType: 999 }),
      ).toThrow('Database type 999 not supported yet!');
    });
  });

  describe('getSchemaQueryForDatabase', () => {
    it('should return MSSQL schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.MSSQL,
      );
      expect(query).toBe(
        'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS;',
      );
    });

    it('should return MSSQL schema query for MySQL too', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.MySQL,
      );
      expect(query).toBe(
        'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS;',
      );
    });

    it('should return MSSQL schema query for MariaDB', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.MariaDB,
      );
      expect(query).toBe(
        'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS;',
      );
    });

    it('should return PostgreSQL schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.PostgreSQL,
      );
      expect(query).toBe(
        'SELECT table_name, column_name, data_type FROM information_schema.columns;',
      );
    });

    it('should return Oracle schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.Oracle,
      );
      expect(query).toBe(
        'SELECT table_name, column_name, data_type FROM all_tab_columns;',
      );
    });

    it('should return IBMDb2 schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.IBMDb2,
      );
      expect(query).toBe(
        'SELECT tabname AS table_name, colname AS column_name, typename AS data_type FROM syscat.columns;',
      );
    });

    it('should return Firebird schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.Firebird,
      );
      expect(query).toBe(
        'SELECT rdb$relation_name AS table_name, rdb$field_name AS column_name, rdb$field_source AS data_type FROM rdb$relation_fields;',
      );
    });

    it('should return H2Database schema query', () => {
      const query = DatabaseFactory.getSchemaQueryForDatabase(
        DatabaseType.H2Database,
      );
      expect(query).toBe(
        'SELECT table_name, column_name, data_type FROM information_schema.columns;',
      );
    });

    it('should throw for unsupported database type', () => {
      expect(() =>
        DatabaseFactory.getSchemaQueryForDatabase(999 as DatabaseType),
      ).toThrow('Database type 999 not supported yet!');
    });
  });

  describe('wrapQueryWithLimit', () => {
    it('should wrap query for MSSQL with TOP', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.MSSQL,
        'SELECT * FROM users;',
        10,
      );
      expect(result).toContain('SELECT TOP (10) * FROM (');
      expect(result).toContain('SELECT * FROM users');
      expect(result).toContain('AS _limitedQuery;');
    });

    it('should trim trailing semicolons from query', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.MSSQL,
        'SELECT * FROM users;;;',
        5,
      );
      expect(result).toContain('SELECT * FROM users');
    });

    it('should wrap query for PostgreSQL with LIMIT', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.PostgreSQL,
        'SELECT * FROM users',
        25,
      );
      expect(result).toBe(
        'SELECT * FROM (\nSELECT * FROM users\n) AS _limitedQuery LIMIT 25;',
      );
    });

    it('should wrap query for MySQL with LIMIT', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.MySQL,
        'SELECT * FROM users',
        100,
      );
      expect(result).toContain('LIMIT 100;');
    });

    it('should wrap query for MariaDB with LIMIT', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.MariaDB,
        'SELECT * FROM users',
        50,
      );
      expect(result).toContain('LIMIT 50;');
    });

    it('should wrap query for H2Database with LIMIT', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.H2Database,
        'SELECT * FROM users',
        30,
      );
      expect(result).toContain('LIMIT 30;');
    });

    it('should wrap query for Oracle with ROWNUM', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.Oracle,
        'SELECT * FROM users',
        20,
      );
      expect(result).toContain('ROWNUM <= 20');
    });

    it('should wrap query for IBMDb2 with ROWNUM', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.IBMDb2,
        'SELECT * FROM users',
        15,
      );
      expect(result).toContain('ROWNUM <= 15');
    });

    it('should wrap query for Firebird with ROWNUM', () => {
      const result = DatabaseFactory.wrapQueryWithLimit(
        DatabaseType.Firebird,
        'SELECT * FROM users',
        5,
      );
      expect(result).toContain('ROWNUM <= 5');
    });

    it('should throw for unsupported database type in wrapQueryWithLimit', () => {
      expect(() =>
        DatabaseFactory.wrapQueryWithLimit(999 as DatabaseType, 'SELECT 1', 1),
      ).toThrow('Database type 999 not supported yet!');
    });
  });

  describe('deriveDatabaseName', () => {
    it('should return MSSQL for MSSQL type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.MSSQL)).toBe(
        'MSSQL',
      );
    });

    it('should return MySQL for MySQL type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.MySQL)).toBe(
        'MySQL',
      );
    });

    it('should return PostgreSQL for PostgreSQL type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.PostgreSQL)).toBe(
        'PostgreSQL',
      );
    });

    it('should return MariaDB for MariaDB type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.MariaDB)).toBe(
        'MariaDB',
      );
    });

    it('should return Oracle for Oracle type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.Oracle)).toBe(
        'Oracle',
      );
    });

    it('should return IBM Db2 for IBMDb2 type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.IBMDb2)).toBe(
        'IBM Db2',
      );
    });

    it('should return Firebird for Firebird type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.Firebird)).toBe(
        'Firebird',
      );
    });

    it('should return H2 for H2Database type', () => {
      expect(DatabaseFactory.deriveDatabaseName(DatabaseType.H2Database)).toBe(
        'H2',
      );
    });

    it('should return empty string for unknown types', () => {
      expect(DatabaseFactory.deriveDatabaseName(999 as DatabaseType)).toBe('');
    });
  });
});
