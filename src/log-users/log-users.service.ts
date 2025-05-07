import { Injectable } from '@nestjs/common';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';

@Injectable()
export class LogUsersService {
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
