import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
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
  ValidateTokenResponse,
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
    @Req() request: Request,
  ): Promise<LoginResponse> {
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || 'unknown';

    return await this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('refresh')
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() request: Request,
  ): Promise<RefreshTokenResponse> {
    const ipAddress = this.extractIpAddress(request);
    return await this.authService.refreshTokens(refreshToken, ipAddress);
  }

  @Post('logout')
  @UseGuards(AuthTokenGuard)
  async logout(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ): Promise<LogoutResponse> {
    return this.authService.logout(tokenPayload.sessionId);
    //return this.authService.logout(tokenPayload.sub);
  }
  /*   async logout(@Req() request: Request): Promise<LogoutResponse> {
    const payload = request['REQUEST_TOKEN_PAYLOAD_KEY'] as TokenPayloadDto & {
      sessionId: number;
    };
    return await this.authService.logout(payload.sub);
  } */

  // Novo endpoint para verificar se o token precisa ser renovado
  @Get('check-token')
  @UseGuards(AuthTokenGuard)
  async checkToken(
    @Req() request: Request,
  ): Promise<{ valid: boolean; needsRenewal: boolean; timeToExpiry?: number }> {
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token não encontrado.');
    }

    const renewalInfo = await this.authService.checkTokenRenewal(token);

    return {
      valid: true,
      ...renewalInfo,
    };
  }

  @Get('validate')
  @UseGuards(AuthTokenGuard)
  /*  async validateToken(@Req() request: Request): Promise<ValidateTokenResponse> {
    const payload = request['REQUEST_TOKEN_PAYLOAD_KEY'] as TokenPayloadDto & {
      sessionId: number;
    }; */
  async validateToken(
    @TokenPayloadParam()
    payload: TokenPayloadDto & {
      sessionId: number;
    },
  ): Promise<ValidateTokenResponse> {
    return {
      id: payload.sub,
      nome: payload.name,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return undefined;
    }
    return authorization.split(' ')[1];
  }

  private extractIpAddress(request: Request): string {
    // Tenta extrair o IP real considerando proxies
    const forwarded = request.headers['x-forwarded-for'] as string;
    const realIp = request.headers['x-real-ip'] as string;
    const cfConnectingIp = request.headers['cf-connecting-ip'] as string;

    return (
      cfConnectingIp ||
      realIp ||
      (forwarded && forwarded.split(',')[0].trim()) ||
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
