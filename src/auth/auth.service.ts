import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { UserUtils } from 'src/common/utils/user.utils';

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
        throw new UnauthorizedException();
      }

      const isMatched: boolean = await bcrypt.compare(
        signInDto.password,
        user?.password,
      );
      if (!isMatched) {
        throw new UnauthorizedException();
      }

      const payload = this.userUtils.mapUserToUserResponseDto(user);

      const token: string = await this.jwtService.signAsync(payload, {
        expiresIn: '60m',
      });
      return token;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error.message);
    }
  }

  public profile = async (id: number): Promise<UserResponseDto> => {
    try {
      return await this.usersService.findOneByIdAsync(id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new Error(error);
    }
  }

  public signUp = async (signupDto: SignUpRequestDto): Promise<UserResponseDto> => {
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
      throw new Error(error.message);
    }
  }
}
