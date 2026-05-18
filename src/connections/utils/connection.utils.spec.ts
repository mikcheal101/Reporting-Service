import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionUtils } from './connection.utils';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { Connection } from '../entity/connections.entity';
import { DatabaseType } from '../databasetype.enum';

describe('ConnectionUtils', () => {
  let connectionUtils: ConnectionUtils;
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionUtils,
        {
          provide: CryptoService,
          useValue: {
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    connectionUtils = module.get<ConnectionUtils>(ConnectionUtils);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  const createMockConnection = (
    overrides: Partial<Connection> = {},
  ): Connection => {
    const conn = new Connection();
    Object.assign(conn, {
      id: 1,
      name: 'test-connection',
      server: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'encrypted-password',
      database: 'testdb',
      isTestSuccessful: true,
      databaseType: DatabaseType.MSSQL,
      ...overrides,
    });
    return conn;
  };

  it('should convert Connection to ConnectionDto', () => {
    jest.spyOn(cryptoService, 'decrypt').mockReturnValue('decrypted-password');

    const connection = createMockConnection();
    const result = connectionUtils.convertToDto(connection);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe('test-connection');
    expect(result.server).toBe('localhost');
    expect(result.port).toBe(1433);
    expect(result.user).toBe('sa');
    expect(result.password).toBe('decrypted-password');
    expect(result.database).toBe('testdb');
    expect(result.isTestSuccessful).toBe(true);
    expect(result.databaseType).toBe(DatabaseType.MSSQL);
    expect(cryptoService.decrypt).toHaveBeenCalledWith('encrypted-password');
  });

  it('should return undefined when connection is undefined', () => {
    const result = connectionUtils.convertToDto(undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when cryptoService.decrypt throws', () => {
    jest.spyOn(cryptoService, 'decrypt').mockImplementation(() => {
      throw new Error('Decryption failed');
    });

    const connection = createMockConnection();
    const result = connectionUtils.convertToDto(connection);

    expect(result).toBeUndefined();
  });

  it('should handle connection with all fields', () => {
    jest.spyOn(cryptoService, 'decrypt').mockReturnValue('pass');

    const connection = createMockConnection({
      id: 42,
      name: 'prod-db',
      server: '10.0.0.1',
      port: 5432,
      user: 'admin',
      database: 'production',
      isTestSuccessful: false,
      databaseType: DatabaseType.PostgreSQL,
    });

    const result = connectionUtils.convertToDto(connection);

    expect(result.id).toBe(42);
    expect(result.name).toBe('prod-db');
    expect(result.server).toBe('10.0.0.1');
    expect(result.port).toBe(5432);
    expect(result.user).toBe('admin');
    expect(result.database).toBe('production');
    expect(result.isTestSuccessful).toBe(false);
    expect(result.databaseType).toBe(DatabaseType.PostgreSQL);
  });

  it('should propagate decryption error and return undefined', () => {
    const decryptError = new Error('bad decrypt');
    jest.spyOn(cryptoService, 'decrypt').mockImplementation(() => {
      throw decryptError;
    });

    const connection = createMockConnection();
    const result = connectionUtils.convertToDto(connection);

    expect(result).toBeUndefined();
  });
});
