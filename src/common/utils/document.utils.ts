// src/common/utils/document.utils.ts
/**
 * Utilitários para manipulação e validação de documentos brasileiros (CPF e CNPJ)
 */

/**
 * Remove caracteres não numéricos de uma string
 * @param value String a ser limpa
 * @returns String contendo apenas números
 */
export function cleanDocumentNumber(value: string | number): string {
  if (!value) return '';

  // Converte para string caso seja número
  const stringValue = String(value);

  // Remove tudo que não for dígito
  return stringValue.replace(/\D/g, '');
}

/**
 * Verifica se uma string representa um CPF (11 dígitos)
 * @param document String do documento
 * @returns true se for do tamanho de um CPF
 */
export function isCpf(document: string | number): boolean {
  const cleaned = cleanDocumentNumber(document);
  return cleaned.length === 11;
}

/**
 * Verifica se uma string representa um CNPJ (14 dígitos)
 * @param document String do documento
 * @returns true se for do tamanho de um CNPJ
 */
export function isCnpj(document: string | number): boolean {
  const cleaned = cleanDocumentNumber(document);
  return cleaned.length === 14;
}

/**
 * Identifica o tipo de documento (CPF ou CNPJ)
 * @param document String do documento
 * @returns 'CPF', 'CNPJ' ou 'INVALID'
 */
export function identifyDocumentType(
  document: string | number,
): 'CPF' | 'CNPJ' | 'INVALID' {
  const cleaned = cleanDocumentNumber(document);

  if (cleaned.length === 11) return 'CPF';
  if (cleaned.length === 14) return 'CNPJ';

  return 'INVALID';
}

/**
 * Calcula o dígito verificador do CPF
 * @param partialCpf CPF parcial (9 primeiros dígitos para primeiro DV, 10 dígitos para segundo DV)
 * @returns O dígito verificador calculado
 */
function calculateCpfVerifierDigit(partialCpf: string): number {
  const digits = partialCpf.split('').map(Number);

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (digits.length + 1 - index);
  }, 0);

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida se um CPF é válido pelo algoritmo
 * @param cpf String ou número do CPF
 * @returns true se o CPF for válido
 */
export function validateCpf(cpf: string | number): boolean {
  const cleaned = cleanDocumentNumber(cpf);

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Calcula o primeiro dígito verificador
  const firstDigit = calculateCpfVerifierDigit(cleaned.slice(0, 9));
  if (Number(cleaned.charAt(9)) !== firstDigit) return false;

  // Calcula o segundo dígito verificador
  const secondDigit = calculateCpfVerifierDigit(cleaned.slice(0, 10));
  if (Number(cleaned.charAt(10)) !== secondDigit) return false;

  return true;
}

/**
 * Calcula o dígito verificador do CNPJ
 * @param partialCnpj CNPJ parcial
 * @returns O dígito verificador calculado
 */
function calculateCnpjVerifierDigit(partialCnpj: string): number {
  const weights =
    partialCnpj.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digits = partialCnpj.split('').map(Number);

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * weights[index];
  }, 0);

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Valida se um CNPJ é válido pelo algoritmo
 * @param cnpj String ou número do CNPJ
 * @returns true se o CNPJ for válido
 */
export function validateCnpj(cnpj: string | number): boolean {
  const cleaned = cleanDocumentNumber(cnpj);

  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Calcula o primeiro dígito verificador
  const firstDigit = calculateCnpjVerifierDigit(cleaned.slice(0, 12));
  if (Number(cleaned.charAt(12)) !== firstDigit) return false;

  // Calcula o segundo dígito verificador
  const secondDigit = calculateCnpjVerifierDigit(cleaned.slice(0, 13));
  if (Number(cleaned.charAt(13)) !== secondDigit) return false;

  return true;
}

/**
 * Valida se um documento (CPF ou CNPJ) é válido
 * @param document String ou número do documento
 * @returns true se o documento for válido
 */
export function validateDocument(document: string | number): boolean {
  const docType = identifyDocumentType(document);

  switch (docType) {
    case 'CPF':
      return validateCpf(document);
    case 'CNPJ':
      return validateCnpj(document);
    default:
      return false;
  }
}

/**
 * Formata um CPF com máscara padrão (XXX.XXX.XXX-XX)
 * @param cpf String ou número do CPF
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCpf(cpf: string | number): string {
  const cleaned = cleanDocumentNumber(cpf);

  if (cleaned.length !== 11) return '';

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ com máscara padrão (XX.XXX.XXX/XXXX-XX)
 * @param cnpj String ou número do CNPJ
 * @returns CNPJ formatado ou string vazia se inválido
 */
export function formatCnpj(cnpj: string | number): string {
  const cleaned = cleanDocumentNumber(cnpj);

  if (cleaned.length !== 14) return '';

  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  );
}

/**
 * Formata um documento (CPF ou CNPJ) com a máscara apropriada
 * @param document String ou número do documento
 * @returns Documento formatado ou string vazia se inválido
 */
export function formatDocument(document: string | number): string {
  const docType = identifyDocumentType(document);

  switch (docType) {
    case 'CPF':
      return formatCpf(document);
    case 'CNPJ':
      return formatCnpj(document);
    default:
      return '';
  }
}
