import { isValidDate, parseDateBrToIso } from '@app/common';
import { onlyNumbers } from '@brazilian-utils/brazilian-utils';

// Interfaces para tipagem
export interface ImportData {
  apresentante: string;
  codigo: string;
  cartorio: string;
  data: string;
  protocolo: string;
  data_protocolo: string;
  data_remessa: string;
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
  data_emissao: string;
  vencimento: string;
  ocorrencia: string;
  data_ocorrencia: string;
  custas_desistencia: string;
  vigencia: string;
  custas_cancelamento: string;
  envio_cenprot: string;
  postergado: string;
  prescricao: string;
}

export class TransformationResult {
  async tranformCsvData(data: ImportData): Promise<void> {
    let transformed;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      transformed = {
        ...item,
        data: parseDateBrToIso(item.data),
        data_protocolo: parseDateBrToIso(item.data_protocolo),
        data_remessa: parseDateBrToIso(item.data_remessa),
        data_emissao: parseDateBrToIso(item.data_emissao),
        vencimento: parseDateBrToIso(item.vencimento),
        data_ocorrencia: parseDateBrToIso(item.data_ocorrencia),
      };
      // fazer outras transformaçãoes depois
    }

    return transformed;
  }
}
