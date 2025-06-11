import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LogUser } from './entities/log-user.entity';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';
import { HashingService } from '@app/auth/hashing/hashing.service';

@Injectable()
export class LogUsersService {
  constructor(
    @InjectRepository(LogUser)
    private readonly logUserRepository: Repository<LogUser>,
    private readonly hashingService: HashingService,
  ) {}

  // Métodos básicos do CRUD
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

  // Métodos específicos para autenticação
  async createLoginEntry(
    userId: number,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<LogUser> {
    // Fecha sessões ativas anteriores
    await this.closeActiveSession(userId);

    const refreshTokenHash = await this.hashingService.hash(refreshToken);
    const refreshExpiryDate = this.calculateRefreshTokenExpiry();

    const logUser = this.logUserRepository.create({
      log_in: new Date(),
      data_registro: new Date(),
      fk_user: userId,
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: refreshExpiryDate,
      ip_address: ipAddress,
      user_agent: userAgent,
      session_active: true,
      last_activity: new Date(),
    });

    return await this.logUserRepository.save(logUser);
  }

  async findActiveSessionByRefreshToken(
    refreshToken: string,
  ): Promise<LogUser | null> {
    const sessions = await this.logUserRepository.find({
      where: {
        session_active: true,
        refresh_token_expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

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

  async updateRefreshToken(
    sessionId: number,
    newRefreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await this.hashingService.hash(newRefreshToken);
    const refreshExpiryDate = this.calculateRefreshTokenExpiry();

    await this.logUserRepository.update(sessionId, {
      refresh_token_hash: refreshTokenHash,
      refresh_token_expires_at: refreshExpiryDate,
      last_activity: new Date(),
    });
  }

  async updateLastActivity(sessionId: number): Promise<void> {
    await this.logUserRepository.update(sessionId, {
      last_activity: new Date(),
    });
  }

  async logoutSession(
    sessionId: number,
    endType: string = 'explicit',
  ): Promise<void> {
    await this.logUserRepository.update(sessionId, {
      log_out: new Date(),
      session_active: false,
      session_end_type: endType,
      refresh_token_hash: null,
    });
  }

  async findActiveSessionByUserId(userId: number): Promise<LogUser | null> {
    return await this.logUserRepository.findOne({
      where: {
        fk_user: userId,
        session_active: true,
      },
      order: { log_in: 'DESC' },
    });
  }

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

  async cleanExpiredSessions(): Promise<number> {
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

  private async closeActiveSession(userId: number): Promise<void> {
    await this.logUserRepository.update(
      {
        fk_user: userId,
        session_active: true,
      },
      {
        log_out: new Date(),
        session_active: false,
        session_end_type: 'implicit',
        refresh_token_hash: null,
      },
    );
  }

  private calculateRefreshTokenExpiry(): Date {
    const refreshTtlSeconds = parseInt(
      process.env.JWT_REFRESH_TTL || '604800',
      10,
    );
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + refreshTtlSeconds);
    return expiryDate;
  }
}
