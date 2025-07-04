import { ConflictException, Injectable } from '@nestjs/common';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';
import { LogImportacaoArquivo } from './entities/log-arquivo-import.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusImportacao } from './enum/log-arquivo.enum';

@Injectable()
export class LogArquivoImportService {
  constructor(
    @InjectRepository(LogImportacaoArquivo)
    private readonly logArquivoImportRepository: Repository<LogImportacaoArquivo>,
  ) {}

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
  async create(createLogArquivoImportDto: CreateLogArquivoImportDto) {
    console.log(createLogArquivoImportDto);

    // 1. Procurar por um registro "sucesso" com o mesmo nome
    const existingSuccessFile = await this.logArquivoImportRepository.findOne({
      where: {
        nome_arquivo: createLogArquivoImportDto.nome_arquivo,
        status: StatusImportacao.SUCESSO, // Apenas verificamos por sucesso
      },
    });

    if (existingSuccessFile) {
      // Se um registro de sucesso já existe, lançar uma exceção de conflito
      throw new ConflictException(
        `O arquivo ${createLogArquivoImportDto.nome_arquivo} já foi importado com sucesso.`,
      );
    }

    // Se não houver um registro de sucesso, ou se houver um de "falha" (que não impedirá a nova inserção)
    // Criar um novo registro no log
    const newFileDto = {
      ...createLogArquivoImportDto,
      data_importacao: new Date(),
      // Se desejar, pode definir um status inicial aqui
      // status: 'pendente',
    };
    const newFile = this.logArquivoImportRepository.create(newFileDto);

    try {
      await this.logArquivoImportRepository.save(newFile);
      return newFile;
    } catch (error) {
      // Embora tenhamos verificado o status 'sucesso' explicitamente,
      // ainda podemos ter erros de banco de dados por outros motivos (ex: tamanho da string, constraints diferentes).
      // Para esta lógica, 'ER_DUP_ENTRY' não deve ocorrer no nome_arquivo se removeu a constraint unique.
      // Deixamos um catch genérico para outros erros de persistência.
      console.error('Erro ao salvar novo log de arquivo:', error);
      throw error;
    }
  }

  // Novo método para atualizar status
  async updateStatus(
    logId: number,
    updateData: Partial<{
      status: StatusImportacao;
      total_registros: number;
      registros_processados: number;
      registros_com_erro: number;
      detalhes_erro: string;
      duracao: string;
    }>,
  ) {
    try {
      await this.logArquivoImportRepository.update(logId, updateData);
    } catch (error) {
      console.error('Erro ao atualizar log de importação:', error);
      // Não lançar erro aqui para não quebrar o fluxo principal
    }
  }

  // Novo método para atualizar progresso
  async updateProgress(
    logId: number,
    progressData: Partial<{
      total_registros: number;
      registros_processados: number;
      registros_com_erro: number;
    }>,
  ) {
    try {
      await this.logArquivoImportRepository.update(logId, progressData);
    } catch (error) {
      console.error('Erro ao atualizar progresso do log:', error);
      // Não lançar erro aqui para não quebrar o fluxo principal
    }
  }

  // Método para buscar logs de importação
  async findByUser(userId: number, page: number = 1, limit: number = 10) {
    const [logs, total] = await this.logArquivoImportRepository.findAndCount({
      where: { fk_usuario: userId },
      order: { data_importacao: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
