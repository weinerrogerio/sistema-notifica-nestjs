import { Injectable } from '@nestjs/common';
import { CreateLogArquivoDto } from './dto/create-log-arquivo.dto';
import { UpdateLogArquivoDto } from './dto/update-log-arquivo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LogImportacaoArquivo } from './entities/log-arquivo.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LogArquivoService {
  constructor(
    @InjectRepository(LogImportacaoArquivo)
    private readonly logArquivoRepository: Repository<LogImportacaoArquivo>,
  ) {}
  create(createLogArquivoDto: CreateLogArquivoDto) {
    const newLogArquivo = {
      ...createLogArquivoDto,
    };
    this.logArquivoRepository.save(newLogArquivo);
  }

  findAll() {
    return `This action returns all logArquivo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logArquivo`;
  }

  update(id: number, updateLogArquivoDto: UpdateLogArquivoDto) {
    console.log(updateLogArquivoDto);

    return `This action updates a #${id} logArquivo`;
  }

  remove(id: number) {
    return `This action removes a #${id} logArquivo`;
  }
}
