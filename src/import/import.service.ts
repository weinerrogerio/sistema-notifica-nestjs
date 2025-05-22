// src/import/import.service.ts (Refatorado)
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { DocProtestoService } from 'src/doc-protesto/doc-protesto.service';
import { DevedorService } from '@app/devedor/devedor.service';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { CredorService } from '@app/credor/credor.service';
import { ApresentanteService } from '@app/apresentante/apresentante.service';
import { DocProtestoCredorService } from '@app/doc-protesto_credor/doc-protesto_credor.service';
import { LogArquivoService } from '@app/log-arquivo/log-arquivo.service';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';
import { StatusImportacao } from '@app/log-arquivo/enum/log-arquivo.enum';

// Importar as utilities criadas
import {
  ImportValidationUtil,
  ImportError,
} from '../utilities/import-validation.util';
import {
  ImportProcessorUtil,
  ProcessingResult,
} from '../utilities/import-processor.util';
import {
  LogManagerUtil,
  LogImportacaoData,
} from '../utilities/log-manager.util';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES')
    private readonly strategies: ImportStrategy[],
    private readonly docProtestoService: DocProtestoService,
    private readonly devedorService: DevedorService,
    private readonly credorService: CredorService,
    private readonly apresentanteService: ApresentanteService,
    private readonly logNotificacaoService: LogNotificacaoService,
    private readonly relacaoProtestoCredorService: DocProtestoCredorService,
    private readonly logArquivoService: LogArquivoService,
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

  async importFile(file: Express.Multer.File, tokenPayload: TokenPayloadDto) {
    const startTime = Date.now();
    let logImportacao: LogImportacaoData | null = null;
    let savedLogImportacao = null;

    try {
      // 1. VALIDAÇÃO INICIAL DO ARQUIVO
      const strategy = this.findImportStrategy(file.mimetype);
      if (!strategy) {
        logImportacao = LogManagerUtil.createUnsupportedFileTypeLog(
          file,
          tokenPayload.sub,
        );
        savedLogImportacao = await this.logArquivoService.create(logImportacao);
        throw new BadRequestException(
          `Formato de arquivo não suportado: ${file.mimetype}`,
        );
      }

      // 2. IMPORTAÇÃO DOS DADOS
      const dados = await strategy.import(file.buffer);

      // 3. VALIDAÇÃO DOS DADOS IMPORTADOS
      const validationResult = ImportValidationUtil.validateImportData(dados);

      if (!validationResult.isValid && dados.length === 0) {
        logImportacao = LogManagerUtil.createEmptyFileLog(
          file,
          tokenPayload.sub,
        );
        savedLogImportacao = await this.logArquivoService.create(logImportacao);
        throw new BadRequestException(
          'Arquivo não contém dados para importação.',
        );
      }

      // 4. CRIAR LOG INICIAL
      logImportacao = LogManagerUtil.createInitialLog(file, tokenPayload.sub);
      LogManagerUtil.updateLogWithValidation(
        logImportacao,
        dados.length,
        validationResult.errors,
      );

      // 5. VERIFICAR SE TODOS OS REGISTROS TÊM ERROS DE VALIDAÇÃO
      if (
        LogManagerUtil.isCompleteValidationFailure(
          validationResult.errors,
          dados.length,
        )
      ) {
        savedLogImportacao = await this.logArquivoService.create(logImportacao);
        throw new BadRequestException(
          'Todos os registros contêm erros de validação.',
        );
      }

      // 6. PROCESSAR REGISTROS VÁLIDOS
      const processingResult = await this.processValidRecords(
        dados,
        validationResult.errors,
      );

      // 7. ATUALIZAR LOG COM RESULTADOS FINAIS
      const duracao = ImportProcessorUtil.formatDuration(
        Date.now() - startTime,
      );
      LogManagerUtil.updateLogWithProcessingResults(
        logImportacao,
        processingResult.registrosProcessados,
        processingResult.errosProcessamento,
        validationResult.errors,
        duracao,
      );

      // 8. SALVAR LOG FINAL
      savedLogImportacao = await this.logArquivoService.create(logImportacao);

      // 9. VERIFICAR SE HOUVE FALHA COMPLETA
      const totalErros =
        validationResult.errors.length +
        processingResult.errosProcessamento.length;
      if (
        LogManagerUtil.isCompleteProcessingFailure(
          processingResult.registrosProcessados,
          totalErros,
        )
      ) {
        throw new InternalServerErrorException(
          'Falha ao processar todos os registros.',
        );
      }

      // 10. RETORNAR RESULTADO DE SUCESSO
      return this.createSuccessResponse(
        savedLogImportacao.id,
        dados.length,
        processingResult.registrosProcessados,
        totalErros,
        logImportacao.status,
      );
    } catch (err) {
      console.error('Erro ao processar importação:', err);
      return await this.handleImportError(
        err,
        startTime,
        logImportacao,
        savedLogImportacao,
      );
    }
  }

  /**
   * Encontra a estratégia de importação apropriada para o tipo de arquivo
   */
  private findImportStrategy(mimetype: string): ImportStrategy | undefined {
    return this.strategies.find((s) => s.canHandle(mimetype));
  }

  /**
   * Processa apenas os registros que passaram na validação
   */
  private async processValidRecords(
    dados: any[],
    errosValidacao: ImportError[],
  ): Promise<ProcessingResult> {
    let registrosProcessados = 0;
    const errosProcessamento: ImportError[] = [];

    for (let i = 0; i < dados.length; i++) {
      const dado = dados[i];
      const linha = i + 1;

      try {
        // Pular registros com erro de validação
        if (!ImportProcessorUtil.canProcessRecord(errosValidacao, linha)) {
          continue;
        }

        await this.processIndividualRecord(dado);
        registrosProcessados++;
      } catch (err) {
        console.error(`Erro ao processar linha ${linha}:`, err);
        errosProcessamento.push(
          ImportProcessorUtil.createProcessingError(linha, err, dado),
        );
      }
    }

    return {
      registrosProcessados,
      errosProcessamento,
    };
  }

  /**
   * Processa um registro individual salvando no banco de dados
   */
  private async processIndividualRecord(dado: any): Promise<void> {
    console.log('Processando registro:', dado);

    // Processar e validar dados do registro
    const processedData = ImportProcessorUtil.processRecord(dado);

    // Salvar apresentante
    await this.apresentanteService.findOrCreate(processedData.apresentante);

    // Salvar documento de protesto
    const savedDocProtesto = await this.docProtestoService.create(
      processedData.docProtesto,
    );
    console.log('savedDocProtesto:', savedDocProtesto);

    // Salvar devedor
    const savedDevedor = await this.devedorService.findOrCreate(
      processedData.devedor,
    );
    console.log('savedDevedor:', savedDevedor);

    // Salvar log de notificação
    const newLogNotificacao = {
      ...processedData.logNotificacao,
      fk_id_protest: savedDocProtesto.id,
      fk_id_devedor: savedDevedor.id,
    };
    await this.logNotificacaoService.create(newLogNotificacao);

    // Salvar credor
    const savedCredor = await this.credorService.create(processedData.credor);
    console.log('savedCredor:', savedCredor);

    // Salvar relação protesto-credor
    const newRelacaoProtestoCredor = {
      fk_doc_protesto: savedDocProtesto.id,
      fk_credor: savedCredor.id,
    };
    await this.relacaoProtestoCredorService.create(newRelacaoProtestoCredor);
  }

  /**
   * Lida com erros durante a importação
   */
  private async handleImportError(
    err: any,
    startTime: number,
    logImportacao: LogImportacaoData | null,
    savedLogImportacao: any,
  ): Promise<never> {
    const duracao = ImportProcessorUtil.formatDuration(Date.now() - startTime);

    // Se ainda não salvou no banco, salvar agora com erro
    if (!savedLogImportacao && logImportacao) {
      LogManagerUtil.updateLogWithCriticalError(logImportacao, err, duracao);

      try {
        await this.logArquivoService.create(logImportacao);
      } catch (logError) {
        console.error('Erro ao salvar log de importação:', logError);
      }
    }

    // Re-lançar o erro original se for BadRequestException ou InternalServerErrorException
    if (
      err instanceof BadRequestException ||
      err instanceof InternalServerErrorException
    ) {
      throw err;
    }

    throw new InternalServerErrorException('Falha ao importar arquivo.');
  }

  /**
   * Cria resposta de sucesso padronizada
   */
  private createSuccessResponse(
    logId: number,
    totalRegistros: number,
    registrosProcessados: number,
    registrosComErro: number,
    status: StatusImportacao,
  ) {
    return {
      success: true,
      message: `Importação concluída. ${registrosProcessados} registros processados com sucesso.`,
      logId,
      totalRegistros,
      registrosProcessados,
      registrosComErro,
      status,
    };
  }
}
