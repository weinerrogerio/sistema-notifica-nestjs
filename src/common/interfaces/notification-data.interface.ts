import { Apresentante } from '@app/apresentante/entities/apresentante.entity';
import { Credor } from '@app/credor/entities/credor.entity';
import { Devedor } from '@app/devedor/entities/devedor.entity';
import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';

// Interface para envio de intimações - Com todos os dados de todas as tabelas - BAIXA PERFORMACE
export type IntimacaoDataCompleto = LogNotificacao & {
  devedor: Devedor;
  protesto: DocProtesto & {
    apresentante: Apresentante;
    credores: Array<{
      credor: Credor;
    }>;
  };
};

export interface IntimacaoData {
  logNotificacaoId: number;
  //dados do devedor
  nomeDevedor: string;
  devedorEmail: string;
  docDevedor: string;
  //dados do titulo
  distribuicao: string;
  dataDistribuicao: Date;
  numTitulo: string; // pode ser "123A ou 123B..."
  valorTotal: number;
  dataVencimento: string; // data string pois pode ser "a vista"
  tabelionato: string;
  //dados do portador/credor
  credor: string;
  //dados apresentante
  portador: string; //apresentante
}

export interface ContatoCartorio {
  nomeTabelionato: string;
  telefone: string;
  email: string;
  endereco?: string;
}

export interface ContatoTabelionatoInterface {
  nomeTabelionato: string;
  codTabelionato: string; //01, 02, 03,...
  telefone: string;
  email: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  from?: string;
}
