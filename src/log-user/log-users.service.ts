import { Injectable } from '@nestjs/common';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { LogUser } from './entities/log-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '@app/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class LogUsersService {
  constructor(
    @InjectRepository(LogUser)
    private readonly logUserRepository: Repository<LogUser>,
    private readonly userService: UserService,
  ) {}

  async createLoginEntry(userId: number) {
    // Primeiro, fechamos qualquer sessão ativa que o usuário possa ter
    await this.closeActiveSession(userId);

    // Calculamos quando o token vai expirar baseado na configuração do JWT
    const tokenExpiryDate = this.calculateTokenExpiry();

    const user = await this.userService.findOneById(userId);
    if (!user) throw new Error('Usuário nao encontrado');
    const logUser = {
      log_in: new Date(),
      fk_id_user: user.id,
      token_expiry_date: tokenExpiryDate,
    };
    return await this.logUserRepository.save(logUser);
  }

  async updateLogoutEntry(userId: number): Promise<LogUser | null> {
    // Busca o registro de login mais recente para o usuário que ainda não tem logout
    const lastLoginEntry = await this.logUserRepository.findOne({
      where: {
        fk_id_user: userId,
        log_out: null, // Considera apenas os registros sem logout
      },
      order: {
        createdAt: 'DESC', // Pega o mais recente
      },
    });
    if (!lastLoginEntry) {
      return null;
    }
    // Atualiza a data de logout
    const logOut = {
      log_out: new Date(),
      session_end_type: 'Explicito',
    };
    //lastLoginEntry.log_out = new Date();
    return this.logUserRepository.save(logOut);
  }

  create(createLogUserDto: CreateLogUserDto) {
    console.log(createLogUserDto);

    return 'This action adds a new logUser';
  }

  findAll() {
    return `This action returns all logUsers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logUser`;
  }

  private async closeActiveSession(userId: number): Promise<void> {
    const activeSessions = await this.logUserRepository.find({
      where: {
        fk_id_user: userId,
        log_out: null,
      },
    });

    for (const session of activeSessions) {
      session.log_out = new Date();
      session.session_end_type = 'implícito'; // Registramos que o logout foi implícito
      await this.logUserRepository.save(session);
    }
  }

  private calculateTokenExpiry(): Date {
    // Assumindo que o token expira em 24 horas (1d --> 86400s)
    // Obter o valor JWT_TTL do ambiente e converter para número
    const jwtTtlSeconds = parseInt(process.env.JWT_TTL || '86400', 10);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + jwtTtlSeconds); // Ajuste conforme sua configuração de expiração
    return expiryDate;
  }
}
