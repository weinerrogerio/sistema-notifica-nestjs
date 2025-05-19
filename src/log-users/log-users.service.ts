import { Injectable } from '@nestjs/common';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';
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
    const user = await this.userService.findOne(userId);
    if (!user) throw new Error('Usuário nao encontrado');
    const logUser = {
      log_in: new Date(),
      fk_id_user: user.id,
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
    lastLoginEntry.log_out = new Date();
    return this.logUserRepository.save(lastLoginEntry);
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

  update(id: number, updateLogUserDto: UpdateLogUserDto) {
    console.log(updateLogUserDto);

    return `This action updates a #${id} logUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} logUser`;
  }
}
