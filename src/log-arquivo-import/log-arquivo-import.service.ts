import { ConflictException, Injectable } from '@nestjs/common';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';
import { LogImportacaoArquivo } from './entities/log-arquivo-import.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LogArquivoImportService {
  constructor(
    @InjectRepository(LogImportacaoArquivo)
    private readonly logArquivoImportRepository: Repository<LogImportacaoArquivo>,
  ) {}
  async create(createLogArquivoImportDto: CreateLogArquivoImportDto) {
    try {
      console.log(createLogArquivoImportDto);
      const newFileDto = {
        ...createLogArquivoImportDto,
        data_importacao: new Date(),
        //duracao: '00:00:00', // retirar - arrumar isso, tem que vir do tempo de leitura
      };
      const newFile = this.logArquivoImportRepository.create(newFileDto);
      await this.logArquivoImportRepository.save(newFile);
      return newFile;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException(
          `O arquivo ${createLogArquivoImportDto.nome_arquivo} ja foi importado`,
        );
      }
    }
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
