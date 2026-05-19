import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { UserUtils } from 'src/common/utils/user.utils';
import { jwtConstants } from './constants';
import { ERRORS } from '../common/constants/error-messages.constant';


@Injectable()
export class AuthService {
  private readonly logger: Logger;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly userUtils: UserUtils,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  public signIn = async (signInDto: SignInRequestDto): Promise<string> => {
    try {
      const user = await this.usersService.findOneAsync(signInDto.email);
      if (!user) {
        throw new UnauthorizedException(ERRORS.INVALID_EMAIL_OR_PASSWORD);
      }

      const isMatched: boolean = await bcrypt.compare(
        signInDto.password,
        user?.password,
      );
      if (!isMatched) {
        throw new UnauthorizedException(ERRORS.INVALID_EMAIL_OR_PASSWORD);
      }

      const userDto = this.userUtils.mapUserToUserResponseDto(user);

      const payload = {
        id: userDto.id,
        username: userDto.username,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        middleName: userDto.middleName,
        phoneNumber: userDto.phoneNumber,
        isActive: userDto.isActive,
        lastLogin: userDto.lastLogin,
        createdAt: userDto.createdAt,
        roles: (userDto.roles || []).map((r) => ({
          id: r.id,
          name: r.name,
          createdAt: r.createdAt,
          permissions: (r.permissions || []).map((p) => ({ id: p.id, name: p.name })),
        })),
        permissions: (userDto.permissions || []).map((p) => ({ id: p.id, name: p.name })),
      };

      const token: string = await this.jwtService.signAsync(payload, {
        expiresIn: jwtConstants.expiresIn,
      });
      return token;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public profile = async (id: number): Promise<UserResponseDto> => {
    try {
      return await this.usersService.findOneByIdAsync(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };

  public signUp = async (
    signupDto: SignUpRequestDto,
  ): Promise<UserResponseDto> => {
    // create a user model
    try {
      const created = await this.usersService.createUserAsync(
        signupDto.email,
        signupDto.password,
        signupDto.firstName,
        signupDto.lastName,
        signupDto.phoneNumber,
        signupDto.middleName,
      );
      return created;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw error;
    }
  };
}
