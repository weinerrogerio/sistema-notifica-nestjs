import { StatusImportacao } from '@app/log-arquivo/enum/log-arquivo.enum';
import { ImportError } from './import-validation.util';

export interface LogImportacaoData {
  nome_arquivo: string;
  mimetype: string;
  tamanho_arquivo: number;
  status: StatusImportacao;
  fk_usuario: number;
  total_registros: number;
  registros_processados: number;
  registros_com_erro: number;
  detalhes_erro: string | null;
  duracao: string | null;
}

export class LogManagerUtil {
  /**
   * Cria objeto inicial de log de importação
   */
  static createInitialLog(
    file: Express.Multer.File,
    userId: number,
  ): LogImportacaoData {
    return {
      nome_arquivo: file.originalname,
      mimetype: file.mimetype,
      tamanho_arquivo: file.size,
      status: StatusImportacao.SUCESSO,
      fk_usuario: userId,
      total_registros: 0,
      registros_processados: 0,
      registros_com_erro: 0,
      detalhes_erro: null,
      duracao: null,
    };
  }

  /**
   * Atualiza log com informações de validação
   */
  static updateLogWithValidation(
    log: LogImportacaoData,
    totalRegistros: number,
    errosValidacao: ImportError[],
  ): void {
    log.total_registros = totalRegistros;
    log.registros_com_erro = errosValidacao.length;

    if (errosValidacao.length > 0) {
      const status =
        errosValidacao.length === totalRegistros
          ? StatusImportacao.FALHA
          : StatusImportacao.PARCIAL;

      log.status = status;
      log.detalhes_erro = JSON.stringify(errosValidacao);
    }
  }

  /**
   * Atualiza log com resultados finais do processamento
   */
  static updateLogWithProcessingResults(
    log: LogImportacaoData,
    registrosProcessados: number,
    errosProcessamento: ImportError[],
    errosValidacao: ImportError[],
    duracao: string,
  ): void {
    const totalErros = errosValidacao.length + errosProcessamento.length;

    // Determinar status final
    let statusFinal = StatusImportacao.SUCESSO;
    if (totalErros > 0) {
      statusFinal =
        registrosProcessados === 0
          ? StatusImportacao.FALHA
          : StatusImportacao.PARCIAL;
    }

    // Atualizar dados do log
    log.status = statusFinal;
    log.registros_processados = registrosProcessados;
    log.registros_com_erro = totalErros;
    log.duracao = duracao;
    log.detalhes_erro = JSON.stringify([
      ...errosValidacao,
      ...errosProcessamento,
    ]);
  }

  /**
   * Atualiza log com erro crítico
   */
  static updateLogWithCriticalError(
    log: LogImportacaoData,
    error: any,
    duracao: string,
  ): void {
    log.status = StatusImportacao.FALHA;
    log.duracao = duracao;

    if (!log.detalhes_erro) {
      log.detalhes_erro = JSON.stringify([
        {
          erro: error.message || 'Erro desconhecido',
        },
      ]);
    }
  }

  /**
   * Cria log de erro para tipo de arquivo não suportado
   */
  static createUnsupportedFileTypeLog(
    file: Express.Multer.File,
    userId: number,
  ): LogImportacaoData {
    const log = this.createInitialLog(file, userId);
    log.status = StatusImportacao.FALHA;
    log.detalhes_erro = JSON.stringify([
      {
        erro: `Formato de arquivo não suportado: ${file.mimetype}`,
      },
    ]);
    return log;
  }

  /**
   * Cria log de erro para arquivo vazio
   */
  static createEmptyFileLog(
    file: Express.Multer.File,
    userId: number,
  ): LogImportacaoData {
    const log = this.createInitialLog(file, userId);
    log.status = StatusImportacao.FALHA;
    log.total_registros = 0;
    log.detalhes_erro = JSON.stringify([
      {
        erro: 'Arquivo não contém dados para importação.',
      },
    ]);
    return log;
  }

  /**
   * Verifica se todos os registros falharam na validação
   */
  static isCompleteValidationFailure(
    errosValidacao: ImportError[],
    totalRegistros: number,
  ): boolean {
    return errosValidacao.length === totalRegistros;
  }

  /**
   * Verifica se houve falha completa no processamento
   */
  static isCompleteProcessingFailure(
    registrosProcessados: number,
    totalErros: number,
  ): boolean {
    return registrosProcessados === 0 && totalErros > 0;
  }
}
