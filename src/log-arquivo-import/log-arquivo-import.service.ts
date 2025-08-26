import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';
import { LogImportacaoArquivo } from './entities/log-arquivo-import.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusImportacao } from './enum/log-arquivo.enum';
import { DocProtestoService } from '@app/doc-protesto/doc-protesto.service';

@Injectable()
export class LogArquivoImportService {
  constructor(
    @InjectRepository(LogImportacaoArquivo)
    private readonly logArquivoImportRepository: Repository<LogImportacaoArquivo>,
    private readonly docProtestoService: DocProtestoService,
  ) {}

  findAll() {
    return `This action returns all logArquivoImport`;
  }

  async findOne(id: number) {
    return await this.logArquivoImportRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  update(id: number, updateLogArquivoImportDto: UpdateLogArquivoImportDto) {
    console.log(updateLogArquivoImportDto);

    return `This action updates a #${id} logArquivoImport`;
  }

  // Remover um arquivo importado, excluindo todos os documentos relacionados
  async remove(id: number) {
    const file = await this.findOne(id);
    if (!file) throw new BadRequestException('File not found');

    try {
      await this.docProtestoService.removeAllByFile(id);
      await this.logArquivoImportRepository.delete(id);
      return `This action removes a #${id} logArquivoImport and all related documents.`;
    } catch (error) {
      throw new HttpException(
        `Erro ao remover o arquivo : ${error.message}`,
        500,
      );
    }
  }

  async create(createLogArquivoImportDto: CreateLogArquivoImportDto) {
    console.log(createLogArquivoImportDto);

    // 1. Procurar por um registro "sucesso" com o mesmo nome
    const existingSuccessFile = await this.logArquivoImportRepository.findOne({
      where: {
        nome_arquivo: createLogArquivoImportDto.nome_arquivo,
        status: Not(StatusImportacao.FALHA), // Ignorar falhas... StatusImportacao.SUCESSO, // Apenas verificamos por sucesso
      },
    });

    if (existingSuccessFile) {
      // Se um registro de sucesso já existe, lançar uma exceção de conflito
      throw new ConflictException(
        `O arquivo ${createLogArquivoImportDto.nome_arquivo} já foi importado com sucesso.`,
      );
    }

    // 2. Criar um novo registro
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
      // Melhorar esse tratamento de erro
      console.error('Erro ao salvar novo log de arquivo:', error);
      throw error;
    }
  }

  async updateStatus(
    id: number,
    updateData: {
      status?: StatusImportacao;
      total_registros?: number;
      registros_processados?: number;
      registros_com_erro?: number;
      detalhes_erro?: string;
      registros_duplicados?: number;
      detalhes_duplicidade?: string;
      duracao?: string;
      detalhes_progresso?: string;
    },
  ): Promise<void> {
    await this.logArquivoImportRepository.update(id, updateData);
  }

  // Novo método para atualizar progresso
  async updateProgress(
    logId: number,
    progressData: Partial<{
      total_registros: number;
      registros_processados: number;
      registros_com_erro: number;
      status: StatusImportacao;
      detalhes_progresso: string;
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
  async findByUser(userId: number, page: number = 1, limit: number = 25) {
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

  async findAllAndUser() {
    const arquivosImportados = await this.logArquivoImportRepository
      .createQueryBuilder('log_arquivo_import')
      .leftJoinAndSelect('log_arquivo_import.usuario', 'usuario') // Nome da relação na entity
      .select([
        'log_arquivo_import.id',
        'log_arquivo_import.nome_arquivo',
        'log_arquivo_import.total_registros',
        'log_arquivo_import.data_importacao',
        'log_arquivo_import.status',
        'log_arquivo_import.registros_com_erro',
        'log_arquivo_import.detalhes_erro',
        'log_arquivo_import.registros_duplicados',
        'log_arquivo_import.detalhes_duplicidade',
        'log_arquivo_import.tamanho_arquivo',
        'usuario.nome', // Apenas o nome do usuário
      ])
      .getMany();
    return arquivosImportados;
  }

  async findByFileName(fileName: string) {
    return await this.logArquivoImportRepository.findOne({
      where: {
        nome_arquivo: fileName,
      },
    });
  }
}
