import { Injectable } from '@nestjs/common';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';

@Injectable()
export class LogArquivoImportService {
  create(createLogArquivoImportDto: CreateLogArquivoImportDto) {
    console.log(createLogArquivoImportDto);

    return 'This action adds a new logArquivoImport';
  }

  findAll() {
    return `This action returns all logArquivoImport`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logArquivoImport`;
  }

  update(id: number, updateLogArquivoImportDto: UpdateLogArquivoImportDto) {
    console.log(updateLogArquivoImportDto);

    return `This action updates a #${id} logArquivoImport`;
  }

  remove(id: number) {
    return `This action removes a #${id} logArquivoImport`;
  }
}
