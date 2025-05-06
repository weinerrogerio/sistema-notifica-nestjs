import { Injectable } from '@nestjs/common';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';

@Injectable()
export class DevedorService {
  create(createDevedorDto: CreateDevedorDto) {
    return 'This action adds a new devedor';
  }

  findAll() {
    return `This action returns all devedor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} devedor`;
  }

  update(id: number, updateDevedorDto: UpdateDevedorDto) {
    return `This action updates a #${id} devedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} devedor`;
  }
}
