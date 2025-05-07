import { Injectable } from '@nestjs/common';
import { CreateLogArquivoDto } from './dto/create-log-arquivo.dto';
import { UpdateLogArquivoDto } from './dto/update-log-arquivo.dto';

@Injectable()
export class LogArquivoService {
  create(createLogArquivoDto: CreateLogArquivoDto) {
    return 'This action adds a new logArquivo';
  }

  findAll() {
    return `This action returns all logArquivo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logArquivo`;
  }

  update(id: number, updateLogArquivoDto: UpdateLogArquivoDto) {
    return `This action updates a #${id} logArquivo`;
  }

  remove(id: number) {
    return `This action removes a #${id} logArquivo`;
  }
}
