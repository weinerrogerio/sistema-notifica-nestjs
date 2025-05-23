import { isValidCNPJ, isValidCPF } from '@brazilian-utils/brazilian-utils';
import { BadRequestException } from '@nestjs/common';

export class DataValidation {
  isValid: boolean = false;
  errorMessage: string;

  async validate(data: any) {
    if (!Array.isArray(data)) {
      throw new Error('O resultado da importação não é um array.');
    }

    for (let i = 0; i < data.length; i++) {
      const dado = data[i];
      const isCpfValid = isValidCPF(dado.documento);
      const isCnpjValid = isValidCNPJ(dado.documento);
      // Se não for nem CPF válido nem CNPJ válido, lança erro
      if (!isCpfValid && !isCnpjValid) {
        throw new BadRequestException(
          `Linha ${i + 1}: Documento inválido (${dado.documento}) para devedor: ${dado.devedor}`,
        );
      }
      // outras validações aqui
    }
  }
}
