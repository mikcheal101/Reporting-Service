import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  const createMockContext = (cookies: Record<string, string> = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          cookies,
        }),
      }),
    }) as any;

  it('should allow when valid token is in cookie', async () => {
    const payload = { sub: 1, username: 'test@example.com' };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

    const context = createMockContext({ access_token: 'valid.jwt.token' });
    const result = await authGuard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token', {
      secret: 'F0R7UNA53CR3TKEYF0R53CUR1NGW3BAP1',
    });
  });

  it('should attach user payload to request', async () => {
    const payload = { sub: 1, username: 'test@example.com' };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

    const request: any = { cookies: { access_token: 'token' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    await authGuard.canActivate(context);
    expect(request['user']).toEqual(payload);
  });

  it('should throw UnauthorizedException when no cookie', async () => {
    const context = createMockContext({});

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when cookies is undefined', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ cookies: undefined }),
      }),
    } as any;

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when invalid token', async () => {
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('invalid token'));

    const context = createMockContext({ access_token: 'invalid.token' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when expired token', async () => {
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('jwt expired'));

    const context = createMockContext({ access_token: 'expired.token' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token is empty string', async () => {
    const context = createMockContext({ access_token: '' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
