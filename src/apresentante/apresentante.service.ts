import { Injectable } from '@nestjs/common';
import { CreateApresentanteDto } from './dto/create-apresentante.dto';
import { UpdateApresentanteDto } from './dto/update-apresentante.dto';

@Injectable()
export class ApresentanteService {
  create(createApresentanteDto: CreateApresentanteDto) {
    return 'This action adds a new apresentante';
  }

  findAll() {
    return `This action returns all apresentante`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apresentante`;
  }

  update(id: number, updateApresentanteDto: UpdateApresentanteDto) {
    return `This action updates a #${id} apresentante`;
  }

  remove(id: number) {
    return `This action removes a #${id} apresentante`;
  }
}
