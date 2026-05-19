import { Test, TestingModule } from '@nestjs/testing';
import { GracefulShutdownService } from './graceful-shutdown.service';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('GracefulShutdownService', () => {
  let service: GracefulShutdownService;
  let mockDataSource: { isInitialized: boolean; destroy: jest.Mock };

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GracefulShutdownService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<GracefulShutdownService>(GracefulShutdownService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should destroy data source on shutdown', async () => {
    await service.onModuleDestroy();
    expect(mockDataSource.destroy).toHaveBeenCalled();
  });

  it('should handle already destroyed data source', async () => {
    mockDataSource.isInitialized = false;
    await service.onModuleDestroy();
    expect(mockDataSource.destroy).not.toHaveBeenCalled();
  });

  it('should handle destroy errors gracefully', async () => {
    mockDataSource.destroy.mockRejectedValue(new Error('Destroy failed'));
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });
});
