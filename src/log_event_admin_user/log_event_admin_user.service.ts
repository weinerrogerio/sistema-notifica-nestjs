import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLogEventAdminUserDto } from './dto/create-log_event_admin_user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEventAdminUser } from './entities/log_event_admin_user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LogEventAdminUserService {
  constructor(
    @InjectRepository(LogEventAdminUser)
    private readonly logEventAdminUserRepository: Repository<LogEventAdminUser>,
  ) {}

  async create(createLogEventAdminUserDto: CreateLogEventAdminUserDto) {
    console.log(createLogEventAdminUserDto);
  }
  /* async createLogEntry(createLogEventAdminUserDto: CreateLogEventAdminUserDto) {
    const fkUser = createLogEventAdminUserDto.fk_id_user;
    const fkIdTarget = createLogEventAdminUserDto.fk_id_target;
    if (!fkUser) {
      throw new NotFoundException(`Usuário não encontrado`);
    }
    if (!fkIdTarget) {
      throw new ForbiddenException(
        `Não é possível salvar uma ação de um usuário desativado ou excluido`,
      );
    }
    const logEntryDto = {
      fk_id_user: fkUser,
      fk_id_target: fkIdTarget,
      event: createLogEventAdminUserDto.event,
      descricao: createLogEventAdminUserDto.descricao,
    };
    await this.logEventAdminUserRepository.save(logEntryDto);
  }
 */
  // Atualizar para incluir sessionId nos logs
  async createLogEntry(
    createLogEventAdminUserDto: CreateLogEventAdminUserDto & {
      sessionId?: number;
    },
  ) {
    if (!createLogEventAdminUserDto.fk_id_user) {
      throw new NotFoundException(`Usuário não encontrado`);
    }
    if (!createLogEventAdminUserDto.fk_id_target) {
      throw new ForbiddenException(
        `Não é possível salvar uma ação de um usuário desativado ou excluido`,
      );
    }
    //const descricao: string = 'Criação de usuário';
    const logEntryDto = {
      fk_id_user: createLogEventAdminUserDto.fk_id_user,
      fk_id_target: createLogEventAdminUserDto.fk_id_target,
      event: createLogEventAdminUserDto.event,
      descricao: createLogEventAdminUserDto?.descricao,
      session_id: createLogEventAdminUserDto.sessionId, // Novo campo
    };

    await this.logEventAdminUserRepository.save(logEntryDto);
  }

  findAll() {
    return `This action returns all logEventAdminUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logEventAdminUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} logEventAdminUser`;
  }
}
