import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConnectionsService } from './connections.service';
import { Connection } from './entity/connections.entity';
import { ConnectionUtils } from './utils/connection.utils';
import { QueryAnalyzerService } from './query-analyzer.service';
import { CryptoService } from 'src/common/security/crypto/crypto.service';
import { QueryCacheService } from 'src/common/cache/query-cache.service';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { ConnectionDto } from './dto/connection.dto';
import { DatabaseFactory } from './database.factory';
import { DatabaseType } from './databasetype.enum';

const makeMockConnection = (overrides = {}) => ({
  id: 1,
  name: 'Test Connection',
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'encryptedPassword',
  database: 'testdb',
  databaseType: DatabaseType.MSSQL,
  isTestSuccessful: true,
  reports: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeMockConnectionDto = (overrides = {}) => ({
  id: 1,
  name: 'Test Connection',
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'decryptedPassword',
  database: 'testdb',
  databaseType: DatabaseType.MSSQL,
  isTestSuccessful: true,
  ...overrides,
});

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  let cryptoService: CryptoService;

  const mockConnectionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockConnectionUtils = {
    convertToDto: jest.fn(),
  };

  const mockCryptoService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockQueryAnalyzerService = {
    generateExplainQuery: jest.fn(),
    analyzePlan: jest.fn(),
    generateIndexingRecommendations: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        {
          provide: getRepositoryToken(Connection),
          useValue: mockConnectionsRepository,
        },
        {
          provide: ConnectionUtils,
          useValue: mockConnectionUtils,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: QueryAnalyzerService,
          useValue: mockQueryAnalyzerService,
        },
        {
          provide: QueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
            buildKey: jest.fn(),
            getStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('testConnectionAsync', () => {
    const testDto: TestConnectionRequestDto = {
      name: 'Test',
      server: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'password',
      database: 'testdb',
      databaseType: DatabaseType.MSSQL,
    };

    it('should test connection successfully', async () => {
      const mockAdapter = { connectAsync: jest.fn().mockResolvedValue(true) };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);

      const result = await service.testConnectionAsync(testDto);

      expect(result).toBe(true);
      expect(mockAdapter.connectAsync).toHaveBeenCalled();
    });

    it('should throw on connection failure', async () => {
      const mockAdapter = {
        connectAsync: jest
          .fn()
          .mockRejectedValue(new Error('Connection failed')),
      };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);

      await expect(service.testConnectionAsync(testDto)).rejects.toThrow(
        'Connection failed',
      );
    });
  });

  describe('connectionsAsync', () => {
    it('should return all connections with decrypted passwords', async () => {
      const conn = makeMockConnection();
      mockConnectionsRepository.find.mockResolvedValue([conn]);
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');

      const result = await service.connectionsAsync();

      expect(result).toHaveLength(1);
      expect(result[0].password).toBe('decryptedPassword');
      expect(mockCryptoService.decrypt).toHaveBeenCalledWith(
        'encryptedPassword',
      );
    });

    it('should return empty array when no connections', async () => {
      mockConnectionsRepository.find.mockResolvedValue([]);

      const result = await service.connectionsAsync();

      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(service.connectionsAsync()).rejects.toThrow('DB error');
    });
  });

  describe('createConnectionAsync', () => {
    const createDto: CreateConnectionRequestDto = {
      name: 'New Connection',
      server: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'plainPassword',
      database: 'newdb',
      databaseType: DatabaseType.MSSQL,
      isTestSuccessful: true,
    };

    it('should create a new connection', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(null);
      mockCryptoService.encrypt.mockReturnValue('encryptedPassword');
      mockConnectionsRepository.create.mockReturnValue(makeMockConnection());
      mockConnectionsRepository.save.mockResolvedValue(makeMockConnection());
      mockConnectionUtils.convertToDto.mockReturnValue(makeMockConnectionDto());

      const result = await service.createConnectionAsync(createDto);

      expect(result).toBeDefined();
      expect(mockCryptoService.encrypt).toHaveBeenCalledWith('plainPassword');
    });

    it('should throw when connection name already exists', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );

      await expect(service.createConnectionAsync(createDto)).rejects.toThrow(
        'A connection with this name already exists',
      );
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.createConnectionAsync(createDto)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('updateConnectionAsync', () => {
    const updateDto: UpdateConnectionRequestDto = {
      name: 'Updated Connection',
      server: 'newserver',
      port: 5432,
      user: 'admin',
      password: 'newPassword',
      database: 'updateddb',
      databaseType: DatabaseType.PostgreSQL,
      isTestSuccessful: false,
    };

    it('should update an existing connection', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );
      mockCryptoService.encrypt.mockReturnValue('newEncrypted');
      mockConnectionsRepository.save.mockResolvedValue(
        makeMockConnection({ name: 'Updated Connection' }),
      );
      mockConnectionUtils.convertToDto.mockReturnValue(
        makeMockConnectionDto({ name: 'Updated Connection' }),
      );

      const result = await service.updateConnectionAsync('1', updateDto);

      expect(result).toBeDefined();
    });

    it('should throw when connection not found', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateConnectionAsync('999', updateDto),
      ).rejects.toThrow('Connection not found');
    });

    it('should update without password when not provided', async () => {
      const updateWithoutPassword: UpdateConnectionRequestDto = {
        name: 'Updated',
      } as UpdateConnectionRequestDto;
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );
      mockConnectionsRepository.save.mockResolvedValue(makeMockConnection());
      mockConnectionUtils.convertToDto.mockReturnValue(makeMockConnectionDto());

      const result = await service.updateConnectionAsync(
        '1',
        updateWithoutPassword,
      );

      expect(result).toBeDefined();
      expect(mockCryptoService.encrypt).not.toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );
      mockCryptoService.encrypt.mockReturnValue('encrypted');
      mockConnectionsRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        service.updateConnectionAsync('1', updateDto),
      ).rejects.toThrow('DB error');
    });
  });

  describe('getOneConnectionAsync', () => {
    it('should return a connection by id', async () => {
      const mockConnection = makeMockConnection();
      mockConnectionsRepository.findOneBy.mockResolvedValue(mockConnection);

      const result = await service.getOneConnectionAsync('1');

      expect(result).toMatchObject({
        id: mockConnection.id,
        name: mockConnection.name,
        server: mockConnection.server,
        port: mockConnection.port,
        user: mockConnection.user,
        database: mockConnection.database,
        databaseType: mockConnection.databaseType,
        isTestSuccessful: mockConnection.isTestSuccessful,
      });
      expect(mockConnectionsRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
      });
    });

    it('should return null when not found', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getOneConnectionAsync('999');

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getOneConnectionAsync('1')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getDecryptedConnectionAsync', () => {
    it('should return connection with decrypted password', async () => {
      const conn = makeMockConnection();
      mockConnectionsRepository.findOneBy.mockResolvedValue(conn);
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');

      const result = await service.getDecryptedConnectionAsync(1);

      expect(result.password).toBe('decryptedPassword');
      expect(mockCryptoService.decrypt).toHaveBeenCalledWith(
        'encryptedPassword',
      );
    });

    it('should return null when connection not found', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getDecryptedConnectionAsync(999);

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.findOneBy.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.getDecryptedConnectionAsync(1)).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('removeConnectionAsync', () => {
    it('should remove a connection', async () => {
      mockConnectionsRepository.delete.mockResolvedValue({
        affected: 1,
        raw: {},
      });

      const result = await service.removeConnectionAsync('1');

      expect(result).toBe(true);
      expect(mockConnectionsRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return false when nothing was deleted', async () => {
      mockConnectionsRepository.delete.mockResolvedValue({
        affected: 0,
        raw: {},
      });

      const result = await service.removeConnectionAsync('999');

      expect(result).toBe(false);
    });

    it('should propagate errors', async () => {
      mockConnectionsRepository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.removeConnectionAsync('1')).rejects.toThrow(
        'DB error',
      );
    });
  });

  describe('getConnectionTablesAsync', () => {
    it('should return connection tables', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');

      const mockAdapter = {
        connectAsync: jest.fn().mockResolvedValue(undefined),
        queryAsync: jest.fn().mockResolvedValue([
          { TABLE_NAME: 'users', COLUMN_NAME: 'id', DATA_TYPE: 'int' },
          { TABLE_NAME: 'users', COLUMN_NAME: 'name', DATA_TYPE: 'varchar' },
        ]),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);
      jest
        .spyOn(DatabaseFactory, 'getSchemaQueryForDatabase')
        .mockReturnValue('SELECT ...');

      const result = await service.getConnectionTablesAsync(1);

      expect(result).toHaveLength(1);
      expect(result[0].tableName).toBe('users');
      expect(result[0].columns).toHaveLength(2);
    });

    it('should throw when connection not found', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getConnectionTablesAsync(999)).rejects.toThrow(
        'Connection not found',
      );
    });

    it('should propagate errors from adapter', async () => {
      mockConnectionsRepository.findOneBy.mockResolvedValue(
        makeMockConnection(),
      );
      mockCryptoService.decrypt.mockReturnValue('decryptedPassword');

      const mockAdapter = {
        connectAsync: jest.fn().mockRejectedValue(new Error('Adapter error')),
        closeAsync: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(DatabaseFactory, 'create').mockReturnValue(mockAdapter as any);

      await expect(service.getConnectionTablesAsync(1)).rejects.toThrow(
        'Adapter error',
      );
    });
  });
});
