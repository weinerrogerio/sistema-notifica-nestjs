export interface IntimacaoData {
  logNotificacaoId: number;
  //dados do devedor
  nomeDevedor: string;
  devedorEmail: string;
  docDevedor: string;
  //dados do titulo
  distribuicao: string;
  dataDistribuicao: Date;
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

export interface ContatoTabelionato {
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
