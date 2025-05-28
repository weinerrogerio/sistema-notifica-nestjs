export interface EmailResult {
  cnpj: string;
  email: string | null;
  fonte?: string;
}

export interface ReceitaWSResponse {
  status: string;
  email?: string;
}

export interface BrasilAPIResponse {
  cnpj: string;
  email?: string;
}

export interface CnpjWsRresponse {
  cnpj: string;
  email?: string;
}

export interface EmailUpdateResult {
  id: number;
  cnpj: string;
  email: string;
}
