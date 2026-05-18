import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { CreateConnectionRequestDto } from './dto/create-connection.request.dto';
import { UpdateConnectionRequestDto } from './dto/update-connection.request.dto';
import { TestConnectionRequestDto } from './dto/test-connection.request.dto';
import { DatabaseType } from './databasetype.enum';

const mockRequest = { user: { id: 1 } } as any;

describe('ConnectionsController', () => {
  let controller: ConnectionsController;
  let connectionsService: ConnectionsService;

  const mockConnectionsService = {
    testConnectionAsync: jest.fn(),
    connectionsAsync: jest.fn(),
    createConnectionAsync: jest.fn(),
    updateConnectionAsync: jest.fn(),
    getDecryptedConnectionAsync: jest.fn(),
    getConnectionTablesAsync: jest.fn(),
    removeConnectionAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectionsController],
      providers: [
        {
          provide: ConnectionsService,
          useValue: mockConnectionsService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ConnectionsController>(ConnectionsController);
    connectionsService = module.get<ConnectionsService>(ConnectionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('testConnection', () => {
    const testDto: TestConnectionRequestDto = {
      name: 'Test',
      server: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'password',
      database: 'testdb',
      databaseType: DatabaseType.MSSQL,
    };

    it('should test a connection', async () => {
      mockConnectionsService.testConnectionAsync.mockResolvedValue(true);

      const result = await controller.testConnection(testDto);

      expect(result).toBe(true);
      expect(mockConnectionsService.testConnectionAsync).toHaveBeenCalledWith(
        testDto,
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.testConnectionAsync.mockRejectedValue(
        new Error('Test failed'),
      );

      await expect(controller.testConnection(testDto)).rejects.toThrow(
        'Test failed',
      );
    });
  });

  describe('getConnections', () => {
    it('should return all connections', async () => {
      mockConnectionsService.connectionsAsync.mockResolvedValue([]);

      const result = await controller.getConnections(mockRequest);

      expect(result).toEqual([]);
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.connectionsAsync.mockRejectedValue(
        new Error('Fetch failed'),
      );

      await expect(controller.getConnections(mockRequest)).rejects.toThrow('Fetch failed');
    });
  });

  describe('createConnection', () => {
    const createDto: CreateConnectionRequestDto = {
      name: 'New Connection',
      server: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'password',
      database: 'newdb',
      databaseType: DatabaseType.MSSQL,
      isTestSuccessful: true,
    };

    it('should create a connection', async () => {
      mockConnectionsService.createConnectionAsync.mockResolvedValue({
        id: 1,
      } as any);

      const result = await controller.createConnection(createDto, mockRequest);

      expect(result).toEqual({ id: 1 });
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.createConnectionAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(controller.createConnection(createDto, mockRequest)).rejects.toThrow(
        'Creation failed',
      );
    });
  });

  describe('updateConnection', () => {
    const updateDto: UpdateConnectionRequestDto = {
      name: 'Updated',
    } as UpdateConnectionRequestDto;

    it('should update a connection', async () => {
      mockConnectionsService.updateConnectionAsync.mockResolvedValue({
        id: 1,
      } as any);

      const result = await controller.updateConnection('1', updateDto, mockRequest);

      expect(result).toEqual({ id: 1 });
      expect(mockConnectionsService.updateConnectionAsync).toHaveBeenCalledWith(
        '1',
        updateDto,
        1,
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.updateConnectionAsync.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(controller.updateConnection('1', updateDto, mockRequest)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('getConnection', () => {
    it('should return a connection by id', async () => {
      mockConnectionsService.getDecryptedConnectionAsync.mockResolvedValue({
        id: 1,
      } as any);

      const result = await controller.getConnection('1', mockRequest);

      expect(result).toEqual({ id: 1 });
      expect(
        mockConnectionsService.getDecryptedConnectionAsync,
      ).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.getDecryptedConnectionAsync.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(controller.getConnection('999', mockRequest)).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('getConnectionTables', () => {
    it('should return connection tables', async () => {
      mockConnectionsService.getConnectionTablesAsync.mockResolvedValue([
        { tableName: 'users', columns: [] },
      ] as any);

      const result = await controller.getConnectionTables('1', mockRequest);

      expect(result).toEqual([{ tableName: 'users', columns: [] }]);
      expect(
        mockConnectionsService.getConnectionTablesAsync,
      ).toHaveBeenCalledWith(1, 1);
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.getConnectionTablesAsync.mockRejectedValue(
        new Error('Failed'),
      );

      await expect(controller.getConnectionTables('1', mockRequest)).rejects.toThrow(
        'Failed',
      );
    });
  });

  describe('deleteConnection', () => {
    it('should delete a connection', async () => {
      mockConnectionsService.removeConnectionAsync.mockResolvedValue(true);

      const result = await controller.deleteConnection('1', mockRequest);

      expect(result).toBe(true);
      expect(mockConnectionsService.removeConnectionAsync).toHaveBeenCalledWith(
        '1',
        1,
      );
    });

    it('should throw BadRequestException on error', async () => {
      mockConnectionsService.removeConnectionAsync.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteConnection('1', mockRequest)).rejects.toThrow(
        'Delete failed',
      );
    });
  });
});
