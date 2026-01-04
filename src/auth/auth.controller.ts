import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signIn(@Body() signInDto: SignInRequestDto) {
    return this.authService.signIn(signInDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  signup(@Body() signupDto: SignUpRequestDto) {
    console.log('Creating user:', signupDto);
    return this.authService.signUp(signupDto);
  }
}
