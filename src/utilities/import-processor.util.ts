import { isValidCNPJ, onlyNumbers } from '@brazilian-utils/brazilian-utils';
import { ImportValidationUtil, ImportError } from './import-validation.util';

export interface ProcessingResult {
  registrosProcessados: number;
  errosProcessamento: ImportError[];
}

export interface ProcessedData {
  apresentante: {
    nome: string;
    cod_apresentante: string | null;
  };
  docProtesto: {
    vencimento: Date;
    data_apresentacao: Date;
    num_distribuicao: string;
    data_distribuicao: Date;
    cart_protesto: string;
    num_titulo: string;
  };
  devedor: {
    nome: string;
    doc_devedor: string;
    devedor_pj: boolean;
  };
  credor: {
    sacador: string | null;
    cedente: string | null;
    doc_credor: string | null;
  };
  logNotificacao: {
    email_enviado: boolean;
    data_envio: Date;
    lido: boolean;
  };
}

export class ImportProcessorUtil {
  /**
   * Processa um registro individual e retorna os dados formatados
   */
  static processRecord(dado: any): ProcessedData {
    // Validar e converter datas
    const { data_vencimento, data_apresentacao, data_distribuicao } =
      ImportValidationUtil.parseAndValidateDates(dado);

    // Preparar dados do apresentante
    const apresentante = {
      nome: dado.apresentante || 'Não informado',
      cod_apresentante: dado.codigo || null,
    };

    // Preparar dados do documento de protesto
    const docProtesto = {
      vencimento: data_vencimento,
      data_apresentacao: data_apresentacao,
      num_distribuicao: dado.protocolo,
      data_distribuicao: data_distribuicao,
      cart_protesto: dado.cartorio,
      num_titulo: dado.numero_do_titulo,
    };

    // Preparar dados do devedor
    const devedor = {
      nome: dado.devedor,
      doc_devedor: onlyNumbers(dado.documento),
      devedor_pj: isValidCNPJ(dado.documento),
    };

    // Preparar dados do credor
    const credor = {
      sacador: dado.sacador || null,
      cedente: dado.cedente || null,
      doc_credor: dado.documento_sacador || null,
    };

    // Preparar dados do log de notificação
    const logNotificacao = {
      email_enviado: false,
      data_envio: new Date(),
      lido: false,
    };

    return {
      apresentante,
      docProtesto,
      devedor,
      credor,
      logNotificacao,
    };
  }

  /**
   * Verifica se um registro pode ser processado (não tem erros de validação)
   */
  static canProcessRecord(
    errosValidacao: ImportError[],
    linha: number,
  ): boolean {
    return !ImportValidationUtil.hasValidationError(errosValidacao, linha);
  }

  /**
   * Formata duração em milissegundos para string HH:MM:SS
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return [
      hours.toString().padStart(2, '0'),
      (minutes % 60).toString().padStart(2, '0'),
      (seconds % 60).toString().padStart(2, '0'),
    ].join(':');
  }

  /**
   * Cria objeto de erro de processamento
   */
  static createProcessingError(
    linha: number,
    error: any,
    dados: any,
  ): ImportError {
    return {
      linha,
      erro: error.message || 'Erro desconhecido',
      dados,
    };
  }
}
