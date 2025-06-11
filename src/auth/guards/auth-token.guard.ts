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
      throw new UnauthorizedException('Nenhum token foi fornecido');
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      // Verifica se há sessão ativa
      const activeSession =
        await this.logUsersService.findActiveSessionByUserId(payload.sub);

      if (!activeSession) {
        throw new UnauthorizedException('Sessão inválida ou expirada');
      }

      // Atualiza última atividade
      await this.logUsersService.updateLastActivity(activeSession.id);

      request['REQUEST_TOKEN_PAYLOAD_KEY'] = {
        ...payload,
        sessionId: activeSession.id,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido', error.message);
    }

    return true;
  }

  extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers?.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return undefined;
    }
    return authorization.split(' ')[1];
  }
}
