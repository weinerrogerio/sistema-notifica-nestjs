import { isValidCNPJ, isValidCPF } from '@brazilian-utils/brazilian-utils';

/**
 * Utilitários para validação de documentos brasileiros (CPF/CNPJ)
 */
export class DocumentValidator {
  /**
   * Valida se um documento (CPF ou CNPJ) é válido
   * @param documento - String contendo o documento a ser validado
   * @returns true se o documento for válido (CPF ou CNPJ), false caso contrário
   */
  static isValidDocument(documento: string): boolean {
    if (!documento || documento.trim() === '') {
      return false;
    }

    const isCpfValid = isValidCPF(documento);
    const isCnpjValid = isValidCNPJ(documento);

    return isCpfValid || isCnpjValid;
  }

  /**
   * Valida especificamente se é um CPF válido
   * @param cpf - String contendo o CPF a ser validado
   * @returns true se for um CPF válido, false caso contrário
   */
  static isValidCPF(cpf: string): boolean {
    if (!cpf || cpf.trim() === '') {
      return false;
    }
    return isValidCPF(cpf);
  }

  /**
   * Valida especificamente se é um CNPJ válido
   * @param cnpj - String contendo o CNPJ a ser validado
   * @returns true se for um CNPJ válido, false caso contrário
   */
  static isValidCNPJ(cnpj: string): boolean {
    if (!cnpj || cnpj.trim() === '') {
      return false;
    }
    return isValidCNPJ(cnpj);
  }
}
