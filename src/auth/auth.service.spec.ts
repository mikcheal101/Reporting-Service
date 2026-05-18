import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { UserUtils } from 'src/common/utils/user.utils';
import { User } from 'src/users/entity/users.entity';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let userUtils: UserUtils;

  const mockUser: User = {
    id: 1,
    username: 'test@test.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    phoneNumber: '1234567890',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
    permissions: [],
  };

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

  const mockUsersService = {
    findOneAsync: jest.fn(),
    findOneByIdAsync: jest.fn(),
    createUserAsync: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockUserUtils = {
    mapUserToUserResponseDto: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserUtils,
          useValue: mockUserUtils,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    userUtils = module.get<UserUtils>(UserUtils);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const signInDto: SignInRequestDto = {
      email: 'test@test.com',
      password: 'password123',
    };

    it('should sign in successfully and return a token', async () => {
      mockUsersService.findOneAsync.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockUserUtils.mapUserToUserResponseDto.mockReturnValue(
        mockUserResponseDto,
      );
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.signIn(signInDto);

      expect(result).toBe('jwt-token');
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        mockUserResponseDto,
        { expiresIn: '60m' },
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findOneAsync.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      mockUsersService.findOneAsync.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.signIn(signInDto)).rejects.toThrow();
    });

    it('should propagate errors', async () => {
      mockUsersService.findOneAsync.mockRejectedValue(new Error('DB error'));

      await expect(service.signIn(signInDto)).rejects.toThrow('DB error');
    });
  });

  describe('profile', () => {
    it('should return user profile', async () => {
      mockUsersService.findOneByIdAsync.mockResolvedValue(mockUserResponseDto);

      const result = await service.profile(1);

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersService.findOneByIdAsync).toHaveBeenCalledWith(1);
    });

    it('should propagate errors', async () => {
      mockUsersService.findOneByIdAsync.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.profile(999)).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpRequestDto = {
      email: 'new@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '1234567890',
      middleName: undefined,
    };

    it('should create a new user', async () => {
      mockUsersService.createUserAsync.mockResolvedValue(mockUserResponseDto);

      const result = await service.signUp(signUpDto);

      expect(result).toEqual(mockUserResponseDto);
      expect(mockUsersService.createUserAsync).toHaveBeenCalledWith(
        'new@test.com',
        'password123',
        'New',
        'User',
        '1234567890',
        undefined,
      );
    });

    it('should propagate errors', async () => {
      mockUsersService.createUserAsync.mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        'Creation failed',
      );
    });
  });
});
