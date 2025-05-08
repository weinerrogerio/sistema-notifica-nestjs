import { Injectable } from '@nestjs/common';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';
import { LogUser } from './entities/log-user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LogUsersService {
  constructor(@InjectRepository(LogUser) private readonly logUserRepository) {}

  create(createLogUserDto: CreateLogUserDto) {
    return 'This action adds a new logUser';
  }

  findAll() {
    return `This action returns all logUsers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logUser`;
  }

  update(id: number, updateLogUserDto: UpdateLogUserDto) {
    return `This action updates a #${id} logUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} logUser`;
  }
}
