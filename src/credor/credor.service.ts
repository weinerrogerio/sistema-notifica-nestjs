import { Injectable } from '@nestjs/common';
import { CreateCredorDto } from './dto/create-credor.dto';
import { UpdateCredorDto } from './dto/update-credor.dto';

@Injectable()
export class CredorService {
  create(createCredorDto: CreateCredorDto) {
    return 'This action adds a new credor';
  }

  findAll() {
    return `This action returns all credor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} credor`;
  }

  update(id: number, updateCredorDto: UpdateCredorDto) {
    return `This action updates a #${id} credor`;
  }

  remove(id: number) {
    return `This action removes a #${id} credor`;
  }
}
