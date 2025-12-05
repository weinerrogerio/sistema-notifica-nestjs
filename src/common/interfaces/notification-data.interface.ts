import { Apresentante } from '@app/apresentante/entities/apresentante.entity';
import { Credor } from '@app/credor/entities/credor.entity';
import { Devedor } from '@app/devedor/entities/devedor.entity';
import { DocProtesto } from '@app/doc-protesto/entities/doc-protesto.entity';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';

//ATENÇÃO: TODA VEZ QUE ATUALIZAR ESSA INTERFACE, ATUALIZAR TAMBÉM: o schema de getValidPlaceholders em template.service
export interface NotificationData {
  // Dados do Devedor
  devedor: {
    nome: string;
    documento: string;
    email: string;
    tipo: 'PF' | 'PJ';
  };
  // Dados do Título/Protesto
  titulo: {
    numero: string;
    valor: string; // Já formatado: "R$ 1.000,50"
    saldo: string; // Já formatado: "R$ 950,25"
    vencimento: string; // Já formatado: "01/12/2025"
  };
  // Dados da Distribuição
  distribuicao: {
    numero: string;
    data: string; // Já formatado: "07/11/2024"
    dataApresentacao: string; // Já formatado
  };
  // Dados do Cartório
  cartorio: {
    nome: string;
    codigo: string;
    telefone: string;
    email: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  // Dados do Credor/Sacador
  credor: {
    nome: string;
    documento: string;
    tipo: 'sacador' | 'cedente';
  };
  // Dados do Portador/Apresentante
  portador: {
    nome: string;
    codigo: string;
  };
  // URLs e Tracking
  urls?: {
    trackingPixel?: string;
    aceiteIntimacao?: string;
    consultaProtesto?: string;
    pagamento?: string;
  };
  // Metadados (opcional)
  metadata?: {
    notificacaoId: number;
    dataEnvio: string;
    templateId?: number;
  };
}

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

export interface intimacaoRequest {
  logNotificacaoId: number;
}

export interface NotificationResult {
  success: boolean;
  message?: string;
}

export interface NotificationResultAll {
  enviados: number;
  erros: number;
  detalhes: Array<{
    id: number;
    email: string;
    sucesso: boolean;
    erro?: string;
  }>;
}

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
