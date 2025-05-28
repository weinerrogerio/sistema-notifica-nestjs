import { isValidDate, parseDateBrToIso } from '@app/common';
import { onlyNumbers } from '@brazilian-utils/brazilian-utils';

// Interfaces para tipagem
export interface ImportData {
  apresentante: string;
  codigo: string;
  cartorio: string;
  data: Date;
  protocolo: string;
  data_protocolo: Date;
  data_remessa: Date;
  agenciacodigo_cedente: string;
  cedente: string;
  sacador: string;
  documento_sacador: string;
  devedor: string;
  documento: string;
  endereco?: string;
  cep: string;
  bairro: string;
  cidade: string;
  uf: string;
  nosso_numero: string;
  numero_do_titulo: string;
  // Alterado para number, representando o valor em centavos
  valor: number;
  // Alterado para number, representando o saldo em centavos
  saldo: number;
  especie: string;
  praca_de_protesto: string;
  tipo_autorizacao: string;
  situacao: string;
  impresso: string;
  data_emissao: Date;
  vencimento: string;
  ocorrencia: string;
  data_ocorrencia: Date;
  custas_desistencia: string;
  vigencia: string;
  custas_cancelamento: string;
  envio_cenprot: string;
  postergado: string;
  prescricao: string;
}

export class TransformationResult {
  async tranformCsvData(
    data: Record<string, string | number>[],
  ): Promise<ImportData[]> {
    const transformedData: ImportData[] = [];
    try {
      for (const dado of data) {
        // Função auxiliar para limpar e converter valores monetários
        const cleanAndConvertMoney = (value: string | number): number => {
          if (typeof value === 'number') {
            // Se já for um número, talvez ele já esteja no formato correto,
            // mas para garantir, vamos tratá-lo como string.
            value = value.toString();
          }
          // Remove pontos e substitui vírgulas por nada para números inteiros (centavos)
          // Ex: "606.51" -> "60651" | "606,51" -> "60651"
          const cleanedValue = value.replace(/\./g, '').replace(/,/g, '');
          // Garante que é um número. Se não for um número válido, retorna 0 ou lança erro.
          const numericValue = parseInt(cleanedValue, 10);
          return isNaN(numericValue) ? 0 : numericValue; // Retorna 0 se a conversão falhar
        };

        const importData: ImportData = {
          apresentante: dado.apresentante as string,
          codigo: dado.codigo as string,
          cartorio: dado.cartorio as string,
          protocolo: dado.protocolo as string,
          agenciacodigo_cedente: dado.agenciacodigo_cedente as string,
          cedente: dado.cedente as string,
          sacador: dado.sacador as string,
          devedor: dado.devedor as string,
          endereco:
            typeof dado.endereco === 'string' ? dado.endereco : undefined,
          cep: dado.cep as string,
          bairro: dado.bairro as string,
          cidade: dado.cidade as string,
          uf: dado.uf as string,
          nosso_numero: dado.nosso_numero as string,
          numero_do_titulo: dado.numero_do_titulo as string,
          // Aplica a nova função de limpeza e conversão
          valor: cleanAndConvertMoney(dado.valor),
          // Aplica a nova função de limpeza e conversão
          saldo: cleanAndConvertMoney(dado.saldo),
          especie: dado.especie as string,
          praca_de_protesto: dado.praca_de_protesto as string,
          tipo_autorizacao: dado.tipo_autorizacao as string,
          situacao: dado.situacao as string,
          impresso: dado.impresso as string,
          custas_desistencia: dado.custas_desistencia as string,
          vigencia: dado.vigencia as string,
          custas_cancelamento: dado.custas_cancelamento as string,
          envio_cenprot: dado.envio_cenprot as string,
          postergado: dado.postergado as string,
          prescricao: dado.prescricao as string,
          ocorrencia: dado.ocorrencia as string,

          // Transformação para Date.
          // Aqui é crucial que dado.data seja uma string ou seja tratado para tal.
          data: isValidDate(dado.data as string)
            ? new Date(dado.data as string)
            : parseDateBrToIso(dado.data as string),

          vencimento: dado.vencimento.toString(),

          data_protocolo: isValidDate(dado.data_protocolo as string)
            ? new Date(dado.data_protocolo as string)
            : parseDateBrToIso(dado.data_protocolo as string),
          data_remessa: isValidDate(dado.data_remessa as string)
            ? new Date(dado.data_remessa as string)
            : parseDateBrToIso(dado.data_remessa as string),
          data_emissao: isValidDate(dado.data_emissao as string)
            ? new Date(dado.data_emissao as string)
            : parseDateBrToIso(dado.data_emissao as string),
          data_ocorrencia: isValidDate(dado.data_ocorrencia as string)
            ? new Date(dado.data_ocorrencia as string)
            : parseDateBrToIso(dado.data_ocorrencia as string),

          documento: onlyNumbers(dado.documento as string),
          documento_sacador: onlyNumbers(dado.documento_sacador as string),
        };

        transformedData.push(importData);
      }
      return transformedData;
    } catch (error) {
      console.error('Erro ao converter dados:', error);
      // É melhor relançar o erro ou lançar uma exceção mais específica
      // para que a camada superior possa tratá-lo adequadamente,
      // em vez de retornar null que pode ser um problema para o chamador.
      throw new Error('Falha na transformação dos dados CSV.');
    }
  }
}
