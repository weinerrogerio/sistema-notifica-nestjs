import { Injectable } from '@nestjs/common';
import { CreateDocProtestoDto } from './dto/create-doc-protesto.dto';
import { UpdateDocProtestoDto } from './dto/update-doc-protesto.dto';

@Injectable()
export class DocProtestoService {
  create(createDocProtestoDto: CreateDocProtestoDto) {
    return 'This action adds a new docProtesto';
  }

  findAll() {
    return `This action returns all docProtesto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} docProtesto`;
  }

  update(id: number, updateDocProtestoDto: UpdateDocProtestoDto) {
    return `This action updates a #${id} docProtesto`;
  }

  remove(id: number) {
    return `This action removes a #${id} docProtesto`;
  }
}
