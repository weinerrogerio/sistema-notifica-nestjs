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
  valor: string;
  saldo: string;
  especie: string;
  praca_de_protesto: string;
  tipo_autorizacao: string;
  situacao: string;
  impresso: string;
  data_emissao: Date;
  vencimento: Date;
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
  async tranformCsvData(data: Record<string, string>[]): Promise<ImportData[]> {
    const transformedData: ImportData[] = [];
    try {
      for (const dado of data) {
        const importData: ImportData = {
          apresentante: dado.apresentante,
          codigo: dado.codigo,
          cartorio: dado.cartorio,
          protocolo: dado.protocolo,
          agenciacodigo_cedente: dado.agenciacodigo_cedente,
          cedente: dado.cedente,
          sacador: dado.sacador,
          devedor: dado.devedor,
          // endereco pode ser opcional, então verifique se existe em dado
          endereco: dado.endereco || undefined, // ou dado.endereco se ele puder ser string vazia
          cep: dado.cep,
          bairro: dado.bairro,
          cidade: dado.cidade,
          uf: dado.uf,
          nosso_numero: dado.nosso_numero,
          numero_do_titulo: dado.numero_do_titulo,
          valor: dado.valor,
          saldo: dado.saldo,
          especie: dado.especie,
          praca_de_protesto: dado.praca_de_protesto,
          tipo_autorizacao: dado.tipo_autorizacao,
          situacao: dado.situacao,
          impresso: dado.impresso,
          custas_desistencia: dado.custas_desistencia,
          vigencia: dado.vigencia,
          custas_cancelamento: dado.custas_cancelamento,
          envio_cenprot: dado.envio_cenprot,
          postergado: dado.postergado,
          prescricao: dado.prescricao,
          ocorrencia: dado.ocorrencia, // Adicione aqui

          // Propriedades que você vai transformar para Date
          data: isValidDate(dado.data)
            ? new Date(dado.data)
            : parseDateBrToIso(dado.data),
          vencimento: isValidDate(dado.vencimento)
            ? new Date(dado.vencimento)
            : parseDateBrToIso(dado.vencimento),
          data_protocolo: isValidDate(dado.data_protocolo)
            ? new Date(dado.data_protocolo)
            : parseDateBrToIso(dado.data_protocolo),
          data_remessa: isValidDate(dado.data_remessa)
            ? new Date(dado.data_remessa)
            : parseDateBrToIso(dado.data_remessa),
          data_emissao: isValidDate(dado.data_emissao)
            ? new Date(dado.data_emissao)
            : parseDateBrToIso(dado.data_emissao),
          data_ocorrencia: isValidDate(dado.data_ocorrencia)
            ? new Date(dado.data_ocorrencia)
            : parseDateBrToIso(dado.data_ocorrencia),

          // Propriedades que você vai transformar para números (se aplicável, mas aqui são strings tratadas por onlyNumbers)
          documento: onlyNumbers(dado.documento),
          documento_sacador: onlyNumbers(dado.documento_sacador),
        };

        transformedData.push(importData);
      }
      return transformedData;
    } catch (error) {
      console.error('Erro ao converter dados:', error);
      return null;
    }
  }
}
