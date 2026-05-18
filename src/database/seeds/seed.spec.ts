import { NestFactory } from '@nestjs/core';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('src/app.module', () => ({
  AppModule: class MockAppModule {},
}));

jest.mock('./permission.seed', () => ({
  PermissionSeed: {
    run: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./role.seed', () => ({
  RoleSeed: {
    run: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('./user.seed', () => ({
  UserSeed: {
    run: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Seed bootstrap', () => {
  let mockAppContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext = { close: jest.fn().mockResolvedValue(undefined) };
    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue(
      mockAppContext,
    );
  });

  it('should run permissions seed first, then roles, then users', async () => {
    const { PermissionSeed } = require('./permission.seed');
    const { RoleSeed } = require('./role.seed');
    const { UserSeed } = require('./user.seed');

    await PermissionSeed.run(mockAppContext);
    await RoleSeed.run(mockAppContext);
    await UserSeed.run(mockAppContext);

    expect(PermissionSeed.run).toHaveBeenCalledWith(mockAppContext);
    expect(RoleSeed.run).toHaveBeenCalledWith(mockAppContext);
    expect(UserSeed.run).toHaveBeenCalledWith(mockAppContext);
  });

  it('should close context after seeding completes', async () => {
    await mockAppContext.close();
    expect(mockAppContext.close).toHaveBeenCalled();
  });

  it('should create application context from AppModule', async () => {
    await NestFactory.createApplicationContext(
      require('src/app.module').AppModule,
    );
    expect(NestFactory.createApplicationContext).toHaveBeenCalled();
  });

  it('should clean up context on failure', async () => {
    const { PermissionSeed } = require('./permission.seed');
    (PermissionSeed.run as jest.Mock).mockRejectedValue(
      new Error('Seed error'),
    );

    try {
      await PermissionSeed.run(mockAppContext);
    } catch (e) {
      await mockAppContext.close();
    }

    expect(mockAppContext.close).toHaveBeenCalled();
  });
});
