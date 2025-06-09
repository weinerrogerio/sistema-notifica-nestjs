/**
 * Utilitários para validação de datas
 */
export class DateValidator {
  /**
   * Valida se uma string está no formato de data brasileiro (DD/MM/AAAA)
   * e se representa uma data válida
   * @param dateString - String da data a ser validada
   * @returns true se a data for válida, false caso contrário
   */
  static isValidDateFormat(dateString: string): boolean {
    if (!dateString || dateString.trim() === '') {
      return false;
    }

    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(dateString)) {
      return false;
    }

    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /**
   * Valida se uma string representa uma data válida (mais flexível com formatos)
   * @param dateString - String da data a ser validada
   * @returns true se a data for válida, false caso contrário
   */
  static isValidDate(dateString: string): boolean {
    if (!dateString || dateString.trim() === '') {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Valida se uma data está dentro de um intervalo específico
   * @param dateString - String da data a ser validada
   * @param minDate - Data mínima permitida (opcional)
   * @param maxDate - Data máxima permitida (opcional)
   * @returns true se a data estiver dentro do intervalo, false caso contrário
   */
  static isDateInRange(
    dateString: string,
    minDate?: Date,
    maxDate?: Date,
  ): boolean {
    if (!this.isValidDateFormat(dateString)) {
      return false;
    }

    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);

    if (minDate && date < minDate) {
      return false;
    }

    if (maxDate && date > maxDate) {
      return false;
    }

    return true;
  }
}
