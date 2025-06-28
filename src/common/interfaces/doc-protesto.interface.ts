export class DistribuicaoResponseDto {
  id: number;
  numDistribuicao: string;
  dataDistribuicao: Date;
  valor: number;
  saldo: number;
  vencimento: Date;
  devedor: {
    id: number;
    nome: string;
    docDevedor: string;
    email: string;
  };
  apresentante: {
    id: number;
    nome: string;
  };
  credores: Array<{
    id: number;
    nome: string;
  }>;
  statusNotificacao?: {
    emailEnviado: boolean;
    dataEnvio?: Date;
    tentativas: number;
  };
}

export class DocProtesto {
  id: number;
  numDistribuicao: string;
  dataDistribuicao: Date;
  valor: number;
  saldo: number;
  vencimento: Date;
  devedor: number;
  apresentante: number;
  credores: Array<number>;
  statusNotificacao?: {
    emailEnviado: boolean;
    dataEnvio?: Date;
    tentativas: number;
  };
}

export interface DistribuicaoSearchResult {
  id: number;
  numDistribuicao: string;
  dataDistribuicao: Date;
  dataApresentacao: Date;
  cartProtesto: string;
  numTitulo: string;
  valor: number;
  saldo: number;
  vencimento: string;
  devedor: Array<{
    id: number;
    nome: string;
    docDevedor: string;
    email: string;
    devedorPj: boolean;
  }>;
  apresentante: {
    id: number;
    nome: string;
  };
  credores: Array<{
    id: number;
    sacador: string;
    cedente: string;
  }>;
  statusNotificacao?: {
    emailEnviado: boolean;
    dataEnvio?: Date;
    lido: boolean;
    dataLeitura?: Date;
    trackingToken?: string;
  };
}

export interface FiltrosDistribuicao {
  devedorNome?: string;
  docDevedor?: string;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  email?: string;
}
