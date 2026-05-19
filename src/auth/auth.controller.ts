import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
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
import { PermissionGuard } from './guard/permission.guard';
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from './helpers/cookie.helper';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { ROUTES, ROUTE_PATHS } from '../common/constants/routes.constant';

@Controller(ROUTES.AUTH)
export class AuthController {
  private readonly logger: Logger;

  constructor(private readonly authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.LOGIN)
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
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(ROUTE_PATHS.REGISTER)
  public async signup(@Body() signupDto: SignUpRequestDto) {
    try {
      return await this.authService.signUp(signupDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post(ROUTE_PATHS.LOGOUT)
  public async logout(@Res({ passthrough: true }) response: Response) {
    try {
      clearAccessTokenCookie(response);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get(ROUTE_PATHS.PROFILE)
  @UseGuards(AuthGuard, PermissionGuard)
  public async profile(@Req() request): Promise<UserResponseDto> {
    try {
      const user = request.user;

      // fetch the user permissions and roles
      const loadedUser: UserResponseDto = await this.authService.profile(
        user.id,
      );
      return loadedUser;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
