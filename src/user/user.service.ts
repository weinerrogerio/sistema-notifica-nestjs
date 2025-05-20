import {
  ConflictException,
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

//BcryptService

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
  ) {}

  async findByRole(role: Role): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
    });
  }
  async create(createUserDto: CreateUserDto) {
    console.log('CHAMANDO CREATE USER DE SERVICE');

    const passwordHash = await this.hashingService.hash(createUserDto.password);

    try {
      const newUserDto = {
        nome: createUserDto?.nome,
        email: createUserDto?.email,
        contato: createUserDto?.contato,
        //passwordHash: createUserDto?.password,
        password_hash: passwordHash,
        role: createUserDto.role || Role.USER,
      };
      const newUser = this.userRepository.create(newUserDto);
      await this.userRepository.save(newUser);
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
    const user = await this.userRepository.find({
      order: {
        id: 'desc',
      },
    });
    return user;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    if (!user) {
      throw new NotFoundException('user não encontrado');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
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
    return user;
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) throw new Error('Usuário nao encontrado');
    return this.userRepository.remove(user);
  }
}
