import { NotificacaoStatus } from '../entities/log-notificacao.entity'; // Importe da sua entidade

/**
 * Mapeamento de eventos do Brevo para o NotificacaoStatus da Entidade
 */
export const BREVO_EVENT_TO_STATUS: Record<string, NotificacaoStatus> = {
  // Envio / Solicitação
  request: NotificacaoStatus.ENVIADO,
  delivered: NotificacaoStatus.ENTREGUE,

  // Abertura (Seu foco principal)
  opened: NotificacaoStatus.LIDO,
  unique_opened: NotificacaoStatus.LIDO,
  proxy_open: NotificacaoStatus.LIDO,

  // Falhas e Bounces
  soft_bounce: NotificacaoStatus.BOUNCE,
  hard_bounce: NotificacaoStatus.BOUNCE,
  invalid_email: NotificacaoStatus.BOUNCE,
  blocked: NotificacaoStatus.FALHA,
  error: NotificacaoStatus.FALHA,
  complaint: NotificacaoStatus.FALHA,

  // Status temporários (Diferido) - Mantemos como PENDENTE ou tratamos como ENVIADO
  deferred: NotificacaoStatus.PENDENTE,
};

/**
 * Função auxiliar para obter descrição (opcional, mas útil para logs)
 */
export function getStatusDescricao(status: NotificacaoStatus): string {
  switch (status) {
    case NotificacaoStatus.PENDENTE:
      return 'Aguardando processamento';
    case NotificacaoStatus.ENVIADO:
      return 'Enviado ao provedor';
    case NotificacaoStatus.ENTREGUE:
      return 'Entregue na caixa de entrada';
    case NotificacaoStatus.LIDO:
      return 'Lido pelo destinatário';
    case NotificacaoStatus.BOUNCE:
      return 'Retornou (Email inválido/cheio)';
    case NotificacaoStatus.FALHA:
      return 'Falha no envio ou bloqueio';
    default:
      return status;
  }
}
