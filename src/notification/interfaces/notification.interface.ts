export interface NotificationResult {
  enviados: number;
  erros: number;
  detalhes: Array<{
    id: number;
    email: string;
    sucesso: boolean;
    erro?: string;
  }>;
}
