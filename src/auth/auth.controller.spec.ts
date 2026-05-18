import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guard/auth.guard';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUserResponseDto: UserResponseDto = {
    id: 1,
    username: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    phoneNumber: '1234567890',
    isActive: true,
    lastLogin: null,
    roles: [],
    permissions: [],
    createdAt: new Date(),
  };

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    profile: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    const signInDto: SignInRequestDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should sign in and set cookie', async () => {
      mockAuthService.signIn.mockResolvedValue('jwt-token');

      const mockResponse = {
        cookie: jest.fn(),
      } as any;

      const result = await controller.signIn(signInDto, mockResponse);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logged In');
      expect(mockAuthService.signIn).toHaveBeenCalledWith(signInDto);
    });

    it('should throw BadRequestException on auth error', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new Error('Invalid credentials'),
      );

      const mockResponse = {} as any;
      await expect(controller.signIn(signInDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('signup', () => {
    const signUpDto: SignUpRequestDto = {
      email: 'new@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '1234567890',
      middleName: undefined,
    };

    it('should register a new user', async () => {
      mockAuthService.signUp.mockResolvedValue(mockUserResponseDto);

      const result = await controller.signup(signUpDto);

      expect(result).toEqual(mockUserResponseDto);
    });

    it('should throw BadRequestException on service error', async () => {
      mockAuthService.signUp.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(controller.signup(signUpDto)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      const result = await controller.logout(mockResponse);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException on error', async () => {
      const mockResponse = {
        clearCookie: jest.fn().mockImplementation(() => {
          throw new Error('Clear failed');
        }),
      } as any;

      await expect(controller.logout(mockResponse)).rejects.toThrow(
        'Clear failed',
      );
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      mockAuthService.profile.mockResolvedValue(mockUserResponseDto);

      const mockRequest = { user: { id: 1 } };
      const result = await controller.profile(mockRequest);

      expect(result).toEqual(mockUserResponseDto);
      expect(mockAuthService.profile).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException on service error', async () => {
      mockAuthService.profile.mockRejectedValue(new Error('Profile error'));

      const mockRequest = { user: { id: 999 } };
      await expect(controller.profile(mockRequest)).rejects.toThrow(
        'Profile error',
      );
    });
  });
});
