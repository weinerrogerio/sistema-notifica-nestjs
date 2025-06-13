import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { LogUsersService } from '@app/log-user/log-users.service';
import { TokenPayloadDto } from '../dto/token-payload.dto';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly logUsersService: LogUsersService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido.');
    }

    try {
      // 1. Verifica o token
      const payload: TokenPayloadDto =
        await this.jwtService.verifyAsync<TokenPayloadDto>(token, {
          secret: this.jwtConfiguration.secret,
          audience: this.jwtConfiguration.audience,
          issuer: this.jwtConfiguration.issuer,
        });

      if (!payload.sub) {
        throw new UnauthorizedException('Token inválido.');
      }

      // 2. Verifica se a sessão ainda é válida
      const activeSession =
        await this.logUsersService.findActiveSessionByUserId(payload.sub);

      if (!activeSession) {
        throw new UnauthorizedException('Sessão inválida ou expirada.');
      }

      // 3. Apenas atualiza a última atividade (sem renovar token aqui)
      await this.logUsersService.updateLastActivity(activeSession.id);

      // 4. Anexa informações à requisição
      request['REQUEST_TOKEN_PAYLOAD_KEY'] = {
        ...payload,
        sessionId: activeSession.id,
      };

      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado. Use o refresh token.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido.');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Falha na autenticação.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return undefined;
    }
    return authorization.split(' ')[1];
  }
}
