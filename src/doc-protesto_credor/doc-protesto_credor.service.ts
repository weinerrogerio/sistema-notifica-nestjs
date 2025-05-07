import { Injectable } from '@nestjs/common';
import { CreateDocProtestoCredorDto } from './dto/create-doc-protesto_credor.dto';
import { UpdateDocProtestoCredorDto } from './dto/update-doc-protesto_credor.dto';

@Injectable()
export class DocProtestoCredorService {
  create(createDocProtestoCredorDto: CreateDocProtestoCredorDto) {
    return 'This action adds a new docProtestoCredor';
  }

  findAll() {
    return `This action returns all docProtestoCredor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} docProtestoCredor`;
  }

  update(id: number, updateDocProtestoCredorDto: UpdateDocProtestoCredorDto) {
    return `This action updates a #${id} docProtestoCredor`;
  }

  remove(id: number) {
    return `This action removes a #${id} docProtestoCredor`;
  }
}
