import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';
import { StatusImportacao } from '@app/log-arquivo-import/enum/log-arquivo.enum';
import { CreateLogArquivoImportDto } from '@app/log-arquivo-import/dto/create-log-arquivo-import.dto';
import { LogArquivoImportService } from '@app/log-arquivo-import/log-arquivo-import.service';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES')
    private readonly strategies: ImportStrategy[],
    private readonly logArquivoImportService: LogArquivoImportService,
  ) {}

  create(createImportDto: CreateImportDto) {
    console.log(createImportDto);
    return 'This action adds a new import';
  }

  findAll() {
    return `This action returns all import`;
  }

  findOne(id: number) {
    return `This action returns a #${id} import`;
  }

  update(id: number, updateImportDto: UpdateImportDto) {
    console.log(updateImportDto);
    return `This action updates a #${id} import`;
  }

  remove(id: number) {
    return `This action removes a #${id} import`;
  }

  async importFile(
    file: Express.Multer.File,
    tokenPayload: TokenPayloadDto,
    sessionId: number,
  ) {
    console.log('tokenPayload: ', tokenPayload);

    const startTime = Date.now();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    let logImport: any = null;
    try {
      // 1. Criar log inicial
      const initialLogData: CreateLogArquivoImportDto = {
        nome_arquivo: file.originalname,
        mimetype: file.mimetype,
        tamanho_arquivo: file.size,
        status: StatusImportacao.FALHA, // Inicia como falha, muda para sucesso no final
        total_registros: 0,
        registros_processados: 0,
        registros_com_erro: 0,
        detalhes_erro: null,
        duracao: null,
        id_session: sessionId, // tokenPayload.sessionId, dependendo da estrutura
        fk_usuario: tokenPayload.sub, // ou tokenPayload.userId, dependendo da estrutura
      };

      logImport = await this.logArquivoImportService.create(initialLogData);
      console.log('ImportService logImport.id:::::: ', logImport.id);

      // 2. Escolha da estratégia
      const strategy = this.strategies.find((s) => s.canHandle(file.mimetype));
      if (!strategy) {
        // Atualizar log com erro de estratégia
        await this.logArquivoImportService.updateStatus(logImport.id, {
          status: StatusImportacao.FALHA,
          detalhes_erro: `Formato de arquivo não suportado: ${file.mimetype}`,
          duracao: this.calculateDuration(startTime),
        });

        throw new BadRequestException(
          `Formato de arquivo não suportado. ${file.mimetype}`,
        );
      }

      // 3. Processar arquivo com auditoria
      await strategy.processFile(file.buffer, tokenPayload, logImport.id);

      // 4. Atualizar log como sucesso (será feito dentro da strategy)
    } catch (error) {
      // Atualizar log com erro, se o log foi criado
      if (logImport) {
        await this.logArquivoImportService.updateStatus(logImport.id, {
          status: StatusImportacao.FALHA,
          detalhes_erro: error.message,
          duracao: this.calculateDuration(startTime),
        });
      }
      throw error;
    }
  }

  private calculateDuration(startTime: number): string {
    const duration = Date.now() - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
}
