// src/common/utils/date.utils.ts
import { parse } from 'date-fns';

/**
 * Verifica se um valor é uma data válida
 * @param value Valor a ser verificado
 * @returns true se o valor é uma data válida, false caso contrário
 */

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isValidDate(value: any): boolean {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Converte uma data no formato brasileiro (dd/MM/yyyy) para o formato ISO
 * @param dateStr String de data no formato brasileiro
 * @returns Um objeto Date ou null se a conversão falhar
 */
export function parseDateBrToIso(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Verifica se a data já está no formato ISO (inclui 'T' ou termina com 'Z')
  if (dateStr.includes('T') || dateStr.endsWith('Z')) {
    const parsedDate = new Date(dateStr);
    return isValidDate(parsedDate) ? parsedDate : null;
  }

  try {
    // Se não for ISO, tenta parsear no formato brasileiro
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  } catch (error) {
    console.error('Erro ao converter data:', error);
    return null;
  }
}
