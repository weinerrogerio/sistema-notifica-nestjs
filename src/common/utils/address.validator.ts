/**
 * Utilitários para validação de dados de endereço brasileiro
 */
export class AddressValidator {
  /**
   * Lista de UFs válidas do Brasil
   */
  private static readonly VALID_UFS = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  /**
   * Valida se um CEP está no formato correto
   * @param cep - String contendo o CEP a ser validado
   * @returns true se o CEP for válido, false caso contrário
   */
  static isValidCep(cep: string): boolean {
    if (!cep || cep.trim() === '') {
      return false;
    }

    const cepPattern = /^\d{5}-?\d{3}$|^\d{8}$/;
    return cepPattern.test(cep.trim());
  }

  /**
   * Valida se uma UF (Unidade Federativa) é válida
   * @param uf - String contendo a UF a ser validada
   * @returns true se a UF for válida, false caso contrário
   */
  static isValidUf(uf: string): boolean {
    if (!uf || uf.trim() === '') {
      return false;
    }

    return this.VALID_UFS.includes(uf.trim().toUpperCase());
  }

  /**
   * Normaliza um CEP removendo caracteres especiais
   * @param cep - String contendo o CEP
   * @returns CEP normalizado (apenas números) ou string vazia se inválido
   */
  static normalizeCep(cep: string): string {
    if (!this.isValidCep(cep)) {
      return '';
    }

    return cep.replace(/\D/g, '');
  }

  /**
   * Formata um CEP no padrão XXXXX-XXX
   * @param cep - String contendo o CEP
   * @returns CEP formatado ou string vazia se inválido
   */
  static formatCep(cep: string): string {
    const normalizedCep = this.normalizeCep(cep);

    if (normalizedCep.length !== 8) {
      return '';
    }

    return `${normalizedCep.slice(0, 5)}-${normalizedCep.slice(5)}`;
  }

  /**
   * Normaliza uma UF para maiúsculas
   * @param uf - String contendo a UF
   * @returns UF normalizada em maiúsculas ou string vazia se inválida
   */
  static normalizeUf(uf: string): string {
    if (!this.isValidUf(uf)) {
      return '';
    }

    return uf.trim().toUpperCase();
  }
}
