import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '@app/auth/hashing/hashing.service';
import { Role } from '@app/common/enums/role.enum';
import { LogEventAdminUserService } from '@app/log_event_admin_user/log_event_admin_user.service';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';

//BcryptService

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly logEventUserService: LogEventAdminUserService,
  ) {}

  async findByRole(role: Role): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
    });
  }
  async create(createUserDto: CreateUserDto, tokenPayload: TokenPayloadDto) {
    const userId = tokenPayload.sub;
    const passwordHash = await this.hashingService.hash(createUserDto.password);
    try {
      const newUserDto = {
        nome: createUserDto?.nome,
        email: createUserDto?.email,
        contato: createUserDto?.contato,
        password_hash: passwordHash,
        role: createUserDto.role || Role.USER,
      };
      const newUser = this.userRepository.create(newUserDto);
      await this.userRepository.save(newUser);
      // Registro de evento de criação
      await this.logEventUserService.createLogEntry({
        fk_id_user: userId, // ID do admin executando a ação
        fk_id_target: newUser.id,
        event: 'CREATE',
        descricao: 'Criação de usuário',
      });
      return newUser;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Email ja cadastrado');
      }
      //melhorar esse tratamento de erro
      console.log('error - CREATE USER');

      throw error;
    }
  }

  async findAll() {
    return await this.userRepository.find({
      where: { is_active: true },
      order: { id: 'desc' },
    });
  }

  async findOne(id: number, tokenPayload: TokenPayloadDto) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (!user.is_active) {
      //Usuário desativado === excluido
      throw new NotFoundException(`Usuário não encontrado`);
    }
    if (tokenPayload.sub !== user.id) {
      throw new ForbiddenException('Acesso negado - Usuário diferente');
    }
    return user;
  }

  async findOneById(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException('user não encontrado');
    }
    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    tokenPayload: TokenPayloadDto,
  ) {
    const userId = tokenPayload.sub;
    const existingUser = await this.userRepository.findOneBy({ id });
    if (!existingUser) {
      throw new NotFoundException(`Usuário não encontrado`);
    }
    if (!existingUser.is_active) {
      throw new ForbiddenException(
        `Não é possível atualizar um usuário desativado`,
      );
    }
    const dataUser = {
      nome: updateUserDto?.nome,
    };
    if (updateUserDto?.password) {
      const passwordHash = await this.hashingService.hash(
        updateUserDto.password,
      );
      dataUser['password_hash'] = passwordHash;
    }
    const user = await this.userRepository.preload({
      id,
      ...dataUser,
    });
    if (!user) throw new Error('Usuário não encontrado');
    await this.userRepository.save(user);
    // Registrar a ação de atualização no log de eventos
    await this.logEventUserService.createLogEntry({
      fk_id_user: userId, // ID do admin executando a ação
      fk_id_target: id,
      event: 'UPDATE',
      descricao: 'Dados do usuário atualizados',
    });
    return user;
  }

  //REATIVA UM USER --> desativado->ativado
  async updateReactivateUser(id: number, tokenPayload: TokenPayloadDto) {
    const userId = tokenPayload.sub;
    const user = await this.findOneById(id);
    user.is_active = true;
    await this.userRepository.save(user);
    // Registrar em log_event_user aqui
    await this.logEventUserService.createLogEntry({
      fk_id_user: userId, // ID do admin executando a ação
      fk_id_target: id,
      event: 'UPDATE',
      descricao: 'Usuário reativado',
    });
    return user;
  }

  //DESATIVA UM USER --> ativo->desativado
  async remove(id: number, tokenPayload: TokenPayloadDto) {
    const userId = tokenPayload.sub;
    const user = await this.findOneById(id);
    // Marcar como inativo em vez de excluir
    user.is_active = false;
    // Registrar em log_event_user aqui
    await this.logEventUserService.createLogEntry({
      fk_id_user: userId, // ID do admin executando a ação
      fk_id_target: id,
      event: 'DELETE',
      descricao: 'Usuário desativado',
    });
    return this.userRepository.save(user);
  }
  //ALERTA! usar isso vai causar problemas com chaves estrangeiras
  /* async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) throw new Error('Usuário nao encontrado');
    return this.userRepository.remove(user);
  } */
}
