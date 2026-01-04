import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { SignInResponseDto } from './dto/signin.response.dto';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { SignUpResponseDto } from './dto/signup.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInRequestDto): Promise<SignInResponseDto> {
    try {
      const user = await this.usersService.findOne(signInDto.email);
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

      const payload = {
        sub: user.id,
        given_name: user.firstName + ' ' + user.middleName,
        family_name: user.lastName,
        email: user.username,
        phoneNumber: user.phoneNumber,
        role: 'User',
      };

      const token: string = await this.jwtService.signAsync(payload);
      return {
        success: true,
        message: 'Authentication Successful',
        errors: [],
        timestamp: new Date().toISOString(),
        requestId: '1',
        data: {
          token: token,
          expiration: '3600',
        },
      };
    } catch (error) {
      console.log(error.message);
      throw new Error(error.message);
    }
  }

  async signUp(signupDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    // create a user model
    try {
      const created = await this.usersService.createUser(
        signupDto.email,
        signupDto.password,
        signupDto.firstName,
        signupDto.lastName,
        signupDto.phoneNumber,
        signupDto.middleName,
      );
      return { isCreated: created };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
