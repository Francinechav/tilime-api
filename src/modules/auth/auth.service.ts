import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';

import * as bcrypt from 'bcrypt';

import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

import { LoginDto } from './dto/login.dto';
import { EmailService } from '../emails/email.service';

import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;

    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.save(user);

    await this.emailService.sendOtpEmail(user.email, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.otpCode !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    user.otpCode = undefined;

    user.otpExpiresAt = undefined;

    await this.usersRepository.save(user);

    const payload = {
      sub: user.id,

      email: user.email,

      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
  async resendOtp(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;

    user.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await this.usersRepository.save(user);

    await this.emailService.sendOtpEmail(user.email, otp);

    return {
      message: 'OTP resent successfully',
    };
  }
}
