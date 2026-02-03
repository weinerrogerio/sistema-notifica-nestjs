/* import { EmailStatus } from '../enums/email-status.enum';
 */
/**
 * Interface para cada evento de email registrado
 */
/* export interface EmailEventRecord {
  evento: string; // Nome do evento do Brevo
  status: EmailStatus; // Status correspondente
  data: Date; // Data/hora do evento
  dispositivo?: string; // Dispositivo usado (para opens/clicks)
  userAgent?: string; // User agent do navegador
  ip?: string; // IP do destinatário
  link?: string; // Link clicado (para eventos de click)
  motivo?: string; // Motivo (para bounces/erros)
  messageId?: string; // ID da mensagem do Brevo
} */

/**
 * Interface para o histórico completo de eventos
 */
/* export interface EmailHistorico {
  eventos: EmailEventRecord[];
  ultimoEvento?: EmailEventRecord;
  statusAtual: EmailStatus;
  totalAberturasUnicas: number;
  totalCliques: number;
  primeiraAbertura?: Date;
  ultimaAbertura?: Date;
} */

/**
 * Interface para atualização de status do log de notificação
 */
/* export interface AtualizacaoStatusEmail {
  status: EmailStatus;
  statusDescricao?: string;
  brevoMessageId?: string;
  ultimoEvento?: string;
  dataUltimoEvento?: Date;
  historicoEventos?: EmailEventRecord[];

  // Campos de interação
  emailAberto?: boolean;
  dataAbertura?: Date;
  totalAberturas?: number;
  linkClicado?: boolean;
  dataClique?: Date;
  totalCliques?: number;

  // Campos de entrega
  emailEntregue?: boolean;
  dataEntrega?: Date;

  // Campos de erro
  motivoErro?: string;
  detalheErro?: string;
}
 */
