import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body()
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }
  @Post('verify-otp')
  verifyOtp(
    @Body()
    dto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(dto);
  }
  @Post('resend-otp')
  resendOtp(
    @Body('email')
    email: string,
  ) {
    return this.authService.resendOtp(email);
  }
}
