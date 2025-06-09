/**
 * Utilitários para validação de valores numéricos e monetários
 */
export class NumericValidator {
  /**
   * Valida se uma string contém apenas números
   * @param value - String a ser validada
   * @returns true se contém apenas números, false caso contrário
   */
  static isNumericOnly(value: string): boolean {
    if (!value || value.trim() === '') {
      return false;
    }

    return /^\d+$/.test(value.trim());
  }

  /**
   * Valida se um valor monetário é válido (formato brasileiro)
   * @param value - String contendo o valor monetário
   * @returns true se o valor for válido e não negativo, false caso contrário
   */
  static isValidMonetaryValue(value: string): boolean {
    if (!value || value.trim() === '') {
      return false;
    }

    const numericValue = this.parseMonetaryValue(value);
    return !isNaN(numericValue) && numericValue >= 0;
  }

  /**
   * Converte um valor monetário brasileiro para número
   * @param value - String contendo o valor monetário (ex: "1.234,56")
   * @returns Número convertido ou NaN se inválido
   */
  static parseMonetaryValue(value: string): number {
    if (!value || value.trim() === '') {
      return NaN;
    }

    // Remove pontos de milhares e substitui vírgula por ponto
    const cleanValue = value.trim().replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
  }

  /**
   * Valida se um número está dentro de um intervalo específico
   * @param value - String contendo o valor
   * @param min - Valor mínimo permitido (opcional)
   * @param max - Valor máximo permitido (opcional)
   * @returns true se estiver dentro do intervalo, false caso contrário
   */
  static isNumberInRange(value: string, min?: number, max?: number): boolean {
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      return false;
    }

    if (min !== undefined && numericValue < min) {
      return false;
    }

    if (max !== undefined && numericValue > max) {
      return false;
    }

    return true;
  }

  /**
   * Valida se um valor é um inteiro positivo
   * @param value - String a ser validada
   * @returns true se for um inteiro positivo, false caso contrário
   */
  static isPositiveInteger(value: string): boolean {
    if (!this.isNumericOnly(value)) {
      return false;
    }

    const numericValue = parseInt(value, 10);
    return numericValue > 0;
  }

  /**
   * Formata um valor monetário no padrão brasileiro
   * @param value - Número a ser formatado
   * @param decimals - Número de casas decimais (padrão: 2)
   * @returns String formatada no padrão brasileiro ou vazia se inválido
   */
  static formatMonetaryValue(value: number, decimals: number = 2): string {
    if (isNaN(value)) {
      return '';
    }

    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}
