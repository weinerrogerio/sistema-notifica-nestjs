import { isValidCNPJ, isValidCPF } from '@brazilian-utils/brazilian-utils';
import { isValidDate, parseDateBrToIso } from '@app/common';

export interface ImportError {
  linha: number;
  erro: string;
  dados?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
}

export class ImportValidationUtil {
  /**
   * Valida todos os registros do arquivo importado
   */
  static validateImportData(dados: any[]): ValidationResult {
    const erros: ImportError[] = [];

    if (!Array.isArray(dados)) {
      return {
        isValid: false,
        errors: [
          { linha: 0, erro: 'O resultado da importação não é um array.' },
        ],
      };
    }

    if (dados.length === 0) {
      return {
        isValid: false,
        errors: [
          { linha: 0, erro: 'Arquivo não contém dados para importação.' },
        ],
      };
    }

    for (let i = 0; i < dados.length; i++) {
      const dado = dados[i];
      const errosLinha = this.validateRecord(dado, i + 1);
      erros.push(...errosLinha);
    }

    return {
      isValid: erros.length === 0,
      errors: erros,
    };
  }

  /**
   * Valida um registro individual
   */
  private static validateRecord(dado: any, linha: number): ImportError[] {
    const erros: ImportError[] = [];

    // Validar campos obrigatórios básicos
    const camposObrigatoriosBasicos = ['documento', 'devedor'];
    for (const campo of camposObrigatoriosBasicos) {
      if (!dado[campo]) {
        erros.push({
          linha,
          erro: `Campo '${campo}' é obrigatório`,
          dados: dado,
        });
      }
    }

    // Se não tem documento, pular validação de CPF/CNPJ
    if (!dado.documento) {
      return erros;
    }

    // Validar CPF/CNPJ
    const isCpfValid = isValidCPF(dado.documento);
    const isCnpjValid = isValidCNPJ(dado.documento);

    if (!isCpfValid && !isCnpjValid) {
      erros.push({
        linha,
        erro: `Documento inválido (${dado.documento}) para devedor: ${dado.devedor}`,
        dados: dado,
      });
    }

    // Validar outros campos obrigatórios
    const camposObrigatorios = [
      'vencimento',
      'data_protocolo',
      'protocolo',
      'cartorio',
      'numero_do_titulo',
    ];

    for (const campo of camposObrigatorios) {
      if (!dado[campo]) {
        erros.push({
          linha,
          erro: `Campo '${campo}' é obrigatório`,
          dados: dado,
        });
      }
    }

    // Validar datas se os campos existem
    if (dado.vencimento && !this.isValidDateField(dado.vencimento)) {
      erros.push({
        linha,
        erro: `Data de vencimento inválida: ${dado.vencimento}`,
        dados: dado,
      });
    }

    if (dado.data_protocolo && !this.isValidDateField(dado.data_protocolo)) {
      erros.push({
        linha,
        erro: `Data de protocolo inválida: ${dado.data_protocolo}`,
        dados: dado,
      });
    }

    if (dado.data_remessa && !this.isValidDateField(dado.data_remessa)) {
      erros.push({
        linha,
        erro: `Data de remessa inválida: ${dado.data_remessa}`,
        dados: dado,
      });
    }

    return erros;
  }

  /**
   * Verifica se um campo de data é válido
   */
  private static isValidDateField(dateValue: any): boolean {
    if (!dateValue) return false;

    try {
      if (isValidDate(dateValue)) {
        return true;
      }
      parseDateBrToIso(dateValue);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Converte e valida datas de um registro
   */
  static parseAndValidateDates(dado: any): {
    data_vencimento: Date;
    data_apresentacao: Date;
    data_distribuicao: Date;
  } {
    let data_vencimento: Date;
    let data_apresentacao: Date;
    let data_distribuicao: Date;

    try {
      data_vencimento = isValidDate(dado.vencimento)
        ? new Date(dado.vencimento)
        : parseDateBrToIso(dado.vencimento);
    } catch (error) {
      throw new Error(
        `Data de vencimento inválida: ${dado.vencimento} - ${error}`,
      );
    }

    try {
      data_apresentacao = isValidDate(dado.data_protocolo)
        ? new Date(dado.data_protocolo)
        : parseDateBrToIso(dado.data_protocolo);
    } catch (error) {
      throw new Error(
        `Data de protocolo inválida: ${dado.data_protocolo} - ${error}`,
      );
    }

    try {
      data_distribuicao = isValidDate(dado.data_remessa)
        ? new Date(dado.data_remessa)
        : parseDateBrToIso(dado.data_remessa);
    } catch (error) {
      throw new Error(
        `Data de remessa inválida: ${dado.data_remessa} - ${error}`,
      );
    }

    return {
      data_vencimento,
      data_apresentacao,
      data_distribuicao,
    };
  }

  /**
   * Determina se há erros críticos que impedem a importação
   */
  static hasCriticalErrors(
    errors: ImportError[],
    totalRecords: number,
  ): boolean {
    return errors.length === totalRecords;
  }

  /**
   * Verifica se um registro tem erro de validação
   */
  static hasValidationError(errors: ImportError[], linha: number): boolean {
    return errors.some((erro) => erro.linha === linha);
  }
}
