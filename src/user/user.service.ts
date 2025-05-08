import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const newUserDto = {
        nome: createUserDto?.nome,
        email: createUserDto?.email,
        contato: createUserDto?.contato,
        password: createUserDto?.password,
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

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    console.log(updateUserDto);

    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
