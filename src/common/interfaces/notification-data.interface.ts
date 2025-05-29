export interface CobrancaData {
  nomeDevedor: string;
  clienteEmail: string;
  valorTotal: number;
  dataVencimento: string;
  dataDistribuicao: string;
  tabelionato: string;
  portador: string;
  credor: string;
  cartorio: string;
  distribuicao: string;
}

export interface ContatoCartorio {
  nomeTabelionato: string;
  telefone: string;
  email: string;
  endereco?: string;
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
}
