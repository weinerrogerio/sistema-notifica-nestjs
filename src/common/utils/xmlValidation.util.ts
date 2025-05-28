import { isValidCNPJ, isValidCPF } from '@brazilian-utils/brazilian-utils';

// Tipo para os dados importados - mais flexível que uma interface rígida
export type ImportDataItem = Record<string, string>;
export type ImportDataArray = ImportDataItem[];

export interface ValidationError {
  linha: number;
  campo: string;
  valor: string | number;
  mensagem: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  totalLinhas: number;
  linhasComErro: number;
}

export class DataValidation {
  async validate(data: ImportDataArray): Promise<ValidationResult> {
    if (!Array.isArray(data)) {
      throw new Error('O resultado da importação não é um array.');
    }

    //console.log('DATA DE IMPORT:::::: ', data);

    const errors: ValidationError[] = [];

    for (let i = 0; i < data.length; i++) {
      const linha = i + 1;
      const item = data[i];

      // Validação de documento (CPF/CNPJ)
      this.validateDocumento(item, linha, errors);

      // Validação de campos obrigatórios
      this.validateRequiredFields(item, linha, errors);

      // Validação de datas
      this.validateDates(item, linha, errors);

      // Validação de valores numéricos
      this.validateNumericFields(item, linha, errors);

      // Validação de CEP
      this.validateCep(item, linha, errors);

      // Validação de UF
      this.validateUf(item, linha, errors);
    }

    const linhasComErro = new Set(errors.map((error) => error.linha)).size;

    return {
      isValid: errors.length === 0,
      errors,
      totalLinhas: data.length,
      linhasComErro,
    };
  }

  private validateDocumento(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    if (!item.documento || item.documento.trim() === '') {
      errors.push({
        linha,
        campo: 'documento',
        valor: item.documento || '',
        mensagem: 'Documento é obrigatório',
      });
      return;
    }

    const isCpfValid = isValidCPF(item.documento);
    const isCnpjValid = isValidCNPJ(item.documento);

    if (!isCpfValid && !isCnpjValid) {
      errors.push({
        linha,
        campo: 'documento',
        valor: item.documento,
        mensagem: `Documento inválido para devedor: ${item.devedor || 'N/A'}`,
      });
    }

    // Validação do documento do sacador se existir
    if (item.documento_sacador && item.documento_sacador.trim() !== '') {
      const isSacadorCpfValid = isValidCPF(item.documento_sacador);
      const isSacadorCnpjValid = isValidCNPJ(item.documento_sacador);

      if (!isSacadorCpfValid && !isSacadorCnpjValid) {
        errors.push({
          linha,
          campo: 'documento_sacador',
          valor: item.documento_sacador,
          mensagem: `Documento do sacador inválido: ${item.documento_sacador}`,
        });
      }
    }
  }

  private validateRequiredFields(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    const requiredFields: string[] = [
      'devedor',
      'cedente',
      'valor',
      'protocolo',
      'data_protocolo',
    ];

    requiredFields.forEach((field) => {
      if (!item[field] || String(item[field]).trim() === '') {
        errors.push({
          linha,
          campo: field,
          valor: item[field] || '',
          mensagem: `Campo obrigatório não preenchido: ${field}`,
        });
      }
    });
  }

  private validateDates(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    const dateFields: string[] = [
      'data',
      'data_protocolo',
      'data_remessa',
      'data_emissao',
      'vencimento',
      'data_ocorrencia',
    ];

    dateFields.forEach((field) => {
      const dateValue = item[field];
      if (dateValue && dateValue.trim() !== '') {
        if (!this.isValidDateFormat(dateValue)) {
          errors.push({
            linha,
            campo: field,
            valor: dateValue,
            mensagem: `Data inválida. Formato esperado: DD/MM/AAAA`,
          });
        }
      }
    });
  }

  private validateNumericFields(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    // Validação de valores monetários
    const monetaryFields: string[] = ['valor', 'saldo'];

    monetaryFields.forEach((field) => {
      const value = item[field];
      if (value && value.trim() !== '') {
        const numericValue = this.parseMonetaryValue(value);
        if (isNaN(numericValue) || numericValue < 0) {
          errors.push({
            linha,
            campo: field,
            valor: value,
            mensagem: `Valor monetário inválido: ${value}`,
          });
        }
      }
    });

    // Validação de códigos numéricos
    const numericFields: string[] = ['codigo', 'protocolo', 'nosso_numero'];

    numericFields.forEach((field) => {
      const value = item[field];
      if (value && value.trim() !== '') {
        if (!/^\d+$/.test(value.trim())) {
          errors.push({
            linha,
            campo: field,
            valor: value,
            mensagem: `Campo deve conter apenas números: ${field}`,
          });
        }
      }
    });
  }

  private validateCep(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    if (item.cep && item.cep.trim() !== '') {
      const cepPattern = /^\d{5}-?\d{3}$|^\d{8}$/;
      if (!cepPattern.test(item.cep)) {
        errors.push({
          linha,
          campo: 'cep',
          valor: item.cep,
          mensagem: 'CEP inválido. Formato esperado: 00000-000 ou 00000000',
        });
      }
    }
  }

  private validateUf(
    item: ImportDataItem,
    linha: number,
    errors: ValidationError[],
  ): void {
    if (item.uf && item.uf.trim() !== '') {
      const validUfs = [
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

      if (!validUfs.includes(item.uf.toUpperCase())) {
        errors.push({
          linha,
          campo: 'uf',
          valor: item.uf,
          mensagem: `UF inválida: ${item.uf}`,
        });
      }
    }
  }

  private isValidDateFormat(dateString: string): boolean {
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

  private parseMonetaryValue(value: string): number {
    // Remove pontos de milhares e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');

    return parseFloat(cleanValue);
  }
}
