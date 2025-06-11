import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { TokenPayloadDto } from './dto/token-payload.dto';
import { AuthTokenGuard } from './guards/auth-token.guard';
import { TokenPayloadParam } from './params/token-payload.param';
import {
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
} from './types/auth.types';

// Extend Request interface para incluir propriedades de IP
declare global {
  //eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ip?: string;
      connection?: {
        remoteAddress?: string;
      };
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponse> {
    // Obtém o IP real do cliente considerando proxies
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Req() req: Request,
  ): Promise<RefreshTokenResponse> {
    const ipAddress = this.getClientIp(req);
    return this.authService.refreshTokens(body.refreshToken, ipAddress);
  }

  @UseGuards(AuthTokenGuard)
  @Post('logout')
  async logout(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ): Promise<LogoutResponse> {
    return this.authService.logout(tokenPayload.sub);
  }

  @UseGuards(AuthTokenGuard)
  @Post('force-logout')
  async forceLogout(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ): Promise<LogoutResponse> {
    return this.authService.forceLogoutUser(tokenPayload.sub);
  }

  private getClientIp(req: Request): string {
    // Considera headers de proxy (X-Forwarded-For, X-Real-IP)
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    if (realIp) {
      return realIp;
    }

    return req.ip || '127.0.0.1';
  }
}
