import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LogUser } from './entities/log-user.entity';
import { CreateLogUserDto } from './dto/create-log-user.dto'; // Assumindo que esses DTOs existem
import { UpdateLogUserDto } from './dto/update-log-user.dto'; // Assumindo que esses DTOs existem
import { HashingService } from '@app/auth/hashing/hashing.service';

@Injectable()
export class LogUsersService {
  constructor(
    @InjectRepository(LogUser)
    private readonly logUserRepository: Repository<LogUser>,
    private readonly hashingService: HashingService,
  ) {}

  // Métodos básicos do CRUD (mantidos inalterados)
  async create(createLogUserDto: CreateLogUserDto): Promise<LogUser> {
    const logUser = this.logUserRepository.create(createLogUserDto);
    return await this.logUserRepository.save(logUser);
  }

  async findAll(): Promise<LogUser[]> {
    return await this.logUserRepository.find({
      relations: ['user'],
      order: { data_registro: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LogUser> {
    const logUser = await this.logUserRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!logUser) {
      throw new Error(`LogUser with ID ${id} not found`);
    }

    return logUser;
  }

  async update(
    id: number,
    updateLogUserDto: UpdateLogUserDto,
  ): Promise<LogUser> {
    await this.logUserRepository.update(id, updateLogUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.logUserRepository.delete(id);
  }

  // Métodos específicos para autenticação e gestão de sessão

  /**
   * Cria uma nova entrada de login no log de usuários, invalidando sessões ativas anteriores.
   * @param userId ID do usuário.
   * @param refreshToken Refresh token do usuário.
   * @param ipAddress Endereço IP da requisição.
   * @param userAgent User-Agent da requisição.
   * @param refreshTokenTtl Tempo de vida do refresh token em segundos.
   * @returns A nova entidade LogUser criada.
   */
  async createLoginEntry(
    userId: number,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
    refreshTokenTtl: number,
  ): Promise<LogUser> {
    // Fecha todas as sessões ativas anteriores para o usuário
    await this.closeActiveSession(userId);

    const refreshTokenHash = await this.hashingService.hash(refreshToken);
    const refreshExpiryDate = this.calculateRefreshTokenExpiry(refreshTokenTtl);

    const logUser = this.logUserRepository.create({
      log_in: new Date(),
      data_registro: new Date(), // Usado para auditoria inicial da sessão
      fk_user: userId,
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: refreshExpiryDate,
      ip_address: ipAddress,
      user_agent: userAgent,
      session_active: true,
      last_activity: new Date(), // Define a atividade inicial ao logar
      session_end_type: null, // Tipo de encerramento ainda não definido
    });

    return await this.logUserRepository.save(logUser);
  }

  /**
   * Busca uma sessão ativa pelo hash do refresh token.
   * @param refreshToken Refresh token a ser validado.
   * @returns A entidade LogUser se encontrada e ativa, senão null.
   */
  async findActiveSessionByRefreshToken(
    refreshToken: string,
  ): Promise<(LogUser & { user?: any }) | null> {
    // Adicionado user?: any para o ManyToOne relation
    const sessions = await this.logUserRepository.find({
      where: {
        session_active: true,
        refresh_token_expires_at: MoreThan(new Date()),
      },
      relations: ['user'], // Carrega a relação com o usuário
    });

    // Percorre as sessões para comparar o hash do refresh token
    for (const session of sessions) {
      if (session.refresh_token_hash) {
        const isValid = await this.hashingService.compare(
          refreshToken,
          session.refresh_token_hash,
        );
        if (isValid) {
          return session;
        }
      }
    }
    return null;
  }

  /**
   * Atualiza o refresh token de uma sessão existente e a atividade.
   * @param sessionId ID da sessão a ser atualizada.
   * @param newRefreshToken Novo refresh token.
   * @param refreshTokenTtl Tempo de vida do novo refresh token em segundos.
   */
  async updateRefreshToken(
    sessionId: number,
    newRefreshToken: string,
    refreshTokenTtl: number,
  ): Promise<void> {
    const refreshTokenHash = await this.hashingService.hash(newRefreshToken);
    const refreshExpiryDate = this.calculateRefreshTokenExpiry(refreshTokenTtl);

    await this.logUserRepository.update(sessionId, {
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: refreshExpiryDate,
      last_activity: new Date(), // Atualiza a última atividade no refresh
    });
  }

  /**
   * Atualiza a última atividade de uma sessão.
   * @param sessionId ID da sessão a ser atualizada.
   */
  async updateLastActivity(sessionId: number): Promise<void> {
    await this.logUserRepository.update(sessionId, {
      last_activity: new Date(),
    });
  }

  /**
   * Encerra uma sessão específica.
   * @param sessionId ID da sessão a ser encerrada.
   * @param endType Tipo de encerramento ('explicit', 'expired', 'forced', 'inactive_timeout', 'revoked', 'implicit').
   */
  async logoutSession(
    sessionId: number,
    endType: string = 'explicit',
  ): Promise<void> {
    await this.logUserRepository.update(sessionId, {
      log_out: new Date(),
      session_active: false,
      session_end_type: endType,
      refresh_token_hash: null, // Limpa o hash do refresh token para invalidá-lo
    });
  }

  /**
   * Busca a sessão ativa mais recente para um determinado usuário.
   * @param userId ID do usuário.
   * @returns A entidade LogUser se encontrada e ativa, senão null.
   */
  async findActiveSessionByUserId(userId: number): Promise<LogUser | null> {
    return await this.logUserRepository.findOne({
      where: {
        fk_user: userId,
        session_active: true,
      },
      order: { log_in: 'DESC' }, // Garante que a sessão mais recente é retornada
      relations: ['user'], // Carrega a relação com o usuário
    });
  }

  /**
   * Revoga todas as sessões ativas de um usuário.
   * @param userId ID do usuário.
   * @returns Número de sessões revogadas.
   */
  async revokeAllUserSessions(userId: number): Promise<number> {
    const result = await this.logUserRepository.update(
      {
        fk_user: userId,
        session_active: true,
      },
      {
        log_out: new Date(),
        session_active: false,
        session_end_type: 'revoked',
        refresh_token_hash: null,
      },
    );

    return result.affected || 0;
  }

  /**
   * Limpa sessões expiradas (baseado no refresh_token_expires_at).
   * @returns Número de sessões encerradas.
   */ async cleanExpiredSessions(): Promise<number> {
    const result = await this.logUserRepository.update(
      {
        session_active: true,
        refresh_token_expires_at: LessThan(new Date()),
      },
      {
        log_out: new Date(),
        session_active: false,
        session_end_type: 'expired',
        refresh_token_hash: null,
      },
    );

    return result.affected || 0;
  }

  async cleanInactiveSessions(): Promise<number> {
    // Limpa sessões que não tiveram atividade por mais de 30 dias
    const inactivityThreshold = new Date();
    inactivityThreshold.setDate(inactivityThreshold.getDate() - 30);

    const result = await this.logUserRepository.update(
      {
        session_active: true,
        last_activity: LessThan(inactivityThreshold),
      },
      {
        log_out: new Date(),
        session_active: false,
        session_end_type: 'inactive_timeout',
        refresh_token_hash: null,
      },
    );

    return result.affected || 0;
  }

  /**
   * Encerra sessões ativas de um usuário antes de criar uma nova.
   * @param userId ID do usuário.
   */
  private async closeActiveSession(userId: number): Promise<void> {
    await this.logUserRepository.update(
      {
        fk_user: userId,
        session_active: true,
      },
      {
        log_out: new Date(),
        session_active: false,
        session_end_type: 'implicit', // Sessão encerrada implicitamente por um novo login
        refresh_token_hash: null,
      },
    );
  }

  /**
   * Calcula a data de expiração para um refresh token.
   * @param refreshTokenTtl Tempo de vida do refresh token em segundos.
   * @returns Data de expiração.
   */
  private calculateRefreshTokenExpiry(refreshTokenTtl: number): Date {
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + refreshTokenTtl);
    return expiryDate;
  }
}
