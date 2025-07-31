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
    const user = await this.findActiveUserByName(loginDto.nome);
    await this.validatePassword(loginDto.password, user.password_hash);

    // Primeiro cria a sessão para obter o sessionId
    const session = await this.logUsersService.createLoginEntry(
      user.id,
      null, // temporário, pois o refresh token ainda não foi gerado
      ipAddress,
      userAgent,
      this.jwtConfiguration.refreshTokenTtl,
    );

    // Agora gera os tokens incluindo o sessionId
    const tokens = await this.generateTokens(user, session.id);

    // Atualiza a sessão com o refresh token real
    await this.logUsersService.updateRefreshToken(
      session.id,
      tokens.refreshToken,
      this.jwtConfiguration.refreshTokenTtl,
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
    const session =
      await this.logUsersService.findActiveSessionByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (!session.user?.is_active) {
      await this.logUsersService.logoutSession(session.id, 'user_deactivated');
      throw new UnauthorizedException('Usuário desativado.');
    }

    // Verificação de segurança: IP diferente pode indicar ataque
    if (session.ip_address !== ipAddress) {
      console.warn(
        `Segurança: Tentativa de refresh de token com IP diferente para sessão ${session.id}: IP original ${session.ip_address} -> IP atual ${ipAddress}`,
      );
      // Opcional: Para maior segurança, descomente as linhas abaixo:
      // await this.logUsersService.logoutSession(session.id, 'ip_change_alert');
      // throw new UnauthorizedException('IP da sessão não corresponde.');
    }

    // Gera novos tokens incluindo o sessionId
    const tokens = await this.generateTokens(session.user, session.id);

    // Atualiza o refresh token na sessão
    await this.logUsersService.updateRefreshToken(
      session.id,
      tokens.refreshToken,
      this.jwtConfiguration.refreshTokenTtl,
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
  // Novo método: Verifica se o token precisa ser renovado
  async checkTokenRenewal(
    token: string,
  ): Promise<{ needsRenewal: boolean; timeToExpiry?: number }> {
    try {
      const decoded = this.jwtService.decode(token) as JwtPayload & {
        exp?: number;
      };
      if (!decoded || !decoded.exp) {
        return { needsRenewal: true };
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = decoded.exp - currentTime;

      // Se faltam menos de 5 minutos (300 segundos), sugere renovação
      const needsRenewal = timeToExpiry < 300;

      return { needsRenewal, timeToExpiry };
    } catch (tokenError) {
      console.error('Erro ao verificar renovação do token:', tokenError);
      return { needsRenewal: true };
    }
  }

  async logout(sessionId: number): Promise<LogoutResponse> {
    const session = await this.logUsersService.findActiveSessionById(sessionId); // Usa o método existente para buscar por ID
    if (!session) {
      return { message: 'Nenhuma sessão ativa encontrada para este ID.' };
    }
    await this.logUsersService.logoutSession(session.id, 'explicit');
    return { message: 'Logout realizado com sucesso.', sessionId: session.id };
  }

  // Novo método: Logout por sessionId específico (já existia, mas o método acima foi modificado para usá-lo)
  async logoutBySessionId(sessionId: number): Promise<LogoutResponse> {
    const session = await this.logUsersService.findActiveSessionById(sessionId);
    if (!session) {
      return { message: 'Sessão não encontrada ou já expirada.' };
    }
    await this.logUsersService.logoutSession(sessionId, 'explicit');
    return { message: 'Logout realizado com sucesso.', sessionId };
  }

  // Novo método: Validação de sessão por token (já existia, está ok)
  async validateTokenSession(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode(token) as JwtPayload;
      if (!decoded || !decoded.sessionId) {
        return false;
      }

      const session = await this.logUsersService.findActiveSessionById(
        decoded.sessionId,
      );
      return !!session;
    } catch {
      return false;
    }
  }

  private async findActiveUserByName(nome: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ nome, is_active: true });
    if (!user) {
      throw new UnauthorizedException('Usuário Inválido ou inativo.');
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
      throw new UnauthorizedException('Credenciais Inválidas');
    }
  }

  private async generateTokens(
    user: User,
    sessionId: number,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      name: user.nome,
      role: user.role,
      sessionId, // Já inclui o sessionId no payload, ótimo!
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
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
}
