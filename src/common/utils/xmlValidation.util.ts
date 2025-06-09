import { DocumentValidator } from './document.validator';
import { DateValidator } from './date.validator';
import { AddressValidator } from './address.validator';
import { NumericValidator } from './numeric.validator';

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

    // Usando o validador comum
    if (!DocumentValidator.isValidDocument(item.documento)) {
      errors.push({
        linha,
        campo: 'documento',
        valor: item.documento,
        mensagem: `Documento inválido para devedor: ${item.devedor || 'N/A'}`,
      });
    }

    // Validação do documento do sacador se existir
    if (item.documento_sacador && item.documento_sacador.trim() !== '') {
      // Usando o validador comum
      if (!DocumentValidator.isValidDocument(item.documento_sacador)) {
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
        // Usando o validador comum
        if (!DateValidator.isValidDateFormat(dateValue)) {
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
        // Usando o validador comum
        if (!NumericValidator.isValidMonetaryValue(value)) {
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
        // Usando o validador comum
        if (!NumericValidator.isNumericOnly(value)) {
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
      // Usando o validador comum
      if (!AddressValidator.isValidCep(item.cep)) {
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
      // Usando o validador comum
      if (!AddressValidator.isValidUf(item.uf)) {
        errors.push({
          linha,
          campo: 'uf',
          valor: item.uf,
          mensagem: `UF inválida: ${item.uf}`,
        });
      }
    }
  }
}
