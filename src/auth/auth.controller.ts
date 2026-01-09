import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { Response } from 'express';
import { SignInResponseDto } from './dto/signin.response.dto';
import { AuthGuard } from './guard/auth.guard';
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from './helpers/cookie.helper';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@Controller('/api/v1/auth')
export class AuthController {
  private readonly logger: Logger;

  constructor(private readonly authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  public async signIn(
    @Body() signInDto: SignInRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignInResponseDto> {
    try {
      const token: string = await this.authService.signIn(signInDto);

      setAccessTokenCookie(response, token);

      return {
        success: true,
        message: 'Logged In',
        timestamp: new Date().toLocaleString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  public async signup(@Body() signupDto: SignUpRequestDto) {
    try {
      return await this.authService.signUp(signupDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  public async logout(@Res({ passthrough: true }) response: Response) {
    try {
      clearAccessTokenCookie(response);
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  @UseGuards(AuthGuard)
  public async profile(@Req() request): Promise<UserResponseDto> {
    try {
      const user = request.user;

      // fetch the user permissions and roles
      const loadedUser: UserResponseDto = await this.authService.profile(user.id);
      return loadedUser;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new BadRequestException(error.message);
    }
  }
}
