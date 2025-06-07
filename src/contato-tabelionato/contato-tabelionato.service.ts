import { Injectable } from '@nestjs/common';
import { CreateContatoTabelionatoDto } from './dto/create-contato-tabelionato.dto';
import { UpdateContatoTabelionatoDto } from './dto/update-contato-tabelionato.dto';

@Injectable()
export class ContatoTabelionatoService {
  create(createContatoTabelionatoDto: CreateContatoTabelionatoDto) {
    return 'This action adds a new contatoTabelionato';
  }

  findAll() {
    return `This action returns all contatoTabelionato`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contatoTabelionato`;
  }

  update(id: number, updateContatoTabelionatoDto: UpdateContatoTabelionatoDto) {
    return `This action updates a #${id} contatoTabelionato`;
  }

  remove(id: number) {
    return `This action removes a #${id} contatoTabelionato`;
  }
}
