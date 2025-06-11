import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { HashingService } from './hashing/hashing.service';
import { LogUsersService } from '@app/log-user/log-users.service';
import { LoginDto } from './dto/login.dto';
import jwtConfig from './config/jwt.config';
import {
  JwtPayload,
  TokenPair,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  ValidateTokenResponse,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
    private readonly logUsersService: LogUsersService,
  ) {}

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginResponse> {
    // Busca usuário ativo
    const user = await this.findActiveUserByName(loginDto.nome);

    // Valida senha
    await this.validatePassword(loginDto.password, user.password_hash);

    // Gera tokens
    const tokens = await this.generateTokens(user);

    // Cria entrada de login com informações da sessão
    const session = await this.logUsersService.createLoginEntry(
      user.id,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        nome: user.nome,
        role: user.role,
        email: user.email,
      },
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
  ): Promise<RefreshTokenResponse> {
    // Valida se o refresh token existe e está ativo
    const session =
      await this.logUsersService.findActiveSessionByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Verifica se o usuário ainda está ativo
    if (!session.user?.is_active) {
      await this.logUsersService.logoutSession(session.id, 'user_deactivated');
      throw new UnauthorizedException('Usuário desativado');
    }

    // Verifica se o IP mudou (opcional: para segurança adicional)
    if (session.ip_address !== ipAddress) {
      // Log de segurança - IP diferente
      console.warn(
        `IP changed for session ${session.id}: ${session.ip_address} -> ${ipAddress}`,
      );
    }

    // Gera novos tokens
    const tokens = await this.generateTokens(session.user);

    // Atualiza o refresh token na sessão
    await this.logUsersService.updateRefreshToken(
      session.id,
      tokens.refreshToken,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: session.id,
      user: {
        id: session.user.id,
        nome: session.user.nome,
        role: session.user.role,
        email: session.user.email,
      },
    };
  }

  async logout(userId: number): Promise<LogoutResponse> {
    const session =
      await this.logUsersService.findActiveSessionByUserId(userId);

    if (!session) {
      return {
        message: 'Nenhuma sessão ativa encontrada',
      };
    }

    await this.logUsersService.logoutSession(session.id, 'explicit');

    return {
      message: 'Logout realizado com sucesso',
      sessionId: session.id,
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      // Verifica e decodifica o token
      const payload = await this.verifyToken(token);

      // Busca o usuário
      const user = await this.findActiveUserById(payload.sub);

      // Busca sessão ativa (opcional para validação)
      const session = await this.logUsersService.findActiveSessionByUserId(
        user.id,
      );

      return {
        id: user.id,
        nome: user.nome,
        role: user.role,
        sessionId: session?.id,
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Token inválido',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }

  async forceLogoutUser(userId: number): Promise<LogoutResponse> {
    const session =
      await this.logUsersService.findActiveSessionByUserId(userId);

    if (!session) {
      return {
        message: 'Nenhuma sessão ativa encontrada para forçar logout',
      };
    }

    await this.logUsersService.logoutSession(session.id, 'forced');

    return {
      message: 'Logout forçado realizado com sucesso',
      sessionId: session.id,
    };
  }

  async revokeAllUserSessions(
    userId: number,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const revokedCount =
      await this.logUsersService.revokeAllUserSessions(userId);

    return {
      message: `Todas as sessões do usuário foram revogadas`,
      sessionsRevoked: revokedCount,
    };
  }

  // Método para limpar sessões expiradas (deve ser chamado por um cron job)
  async cleanExpiredSessions(): Promise<{
    message: string;
    sessionsRevoked: number;
  }> {
    const revokedCount = await this.logUsersService.cleanExpiredSessions();

    return {
      message: `Sessões expiradas foram limpas`,
      sessionsRevoked: revokedCount,
    };
  }

  // Métodos privados para lógica interna
  private async findActiveUserByName(nome: string): Promise<User> {
    const user = await this.userRepository.findOneBy({
      nome,
      is_active: true,
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return user;
  }

  private async findActiveUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({
      id,
      is_active: true,
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return user;
  }

  private async validatePassword(
    password: string,
    passwordHash: string,
  ): Promise<void> {
    const passwordIsValid = await this.hashingService.compare(
      password,
      passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Senha inválida');
    }
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      name: user.nome,
      role: user.role,
    };

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(payload),
        this.generateRefreshToken(payload),
      ]);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException(
        'Erro ao gerar tokens',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.accessTokenTtl,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
    });
  }

  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.refreshTokenTtl,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
    });
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      // Validação adicional do payload
      if (!payload.sub || typeof payload.sub !== 'number') {
        throw new UnauthorizedException('Token com payload inválido');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Token inválido ou expirado',
        error instanceof Error ? error.message : 'Erro na validação do token',
      );
    }
  }
}
