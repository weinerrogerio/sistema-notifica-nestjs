import { Controller, Post, Body, Logger, HttpCode, Get } from '@nestjs/common';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { BREVO_EVENT_TO_STATUS } from '@app/log-notificacao/enums/email-status.enum';
import { log } from 'console';

/**
 * Interface do payload do webhook do Brevo
 */
/* interface BrevoWebhookPayload {
  event: string;
  email?: string;
  tag?: string;
  tags?: string[];
  date?: string;
  ts?: number;
  ts_event?: number;
  reason?: string; // Motivo de erro
  error?: string; // Erro
} */

interface BrevoWebhookPayload {
  contact_id?: number;
  date?: string;
  device_used?: string;
  email?: string;
  event: string;
  id?: number;
  link?: string;
  'message-id'?: string;
  mirror_link?: string;
  sender_email?: string;
  'sending ip'?: string;
  subject?: string;
  tag?: string; // String JSON com as tags
  tags?: string[]; // Array de tags
  template_id?: number;
  ts?: number;
  ts_epoch?: number;
  ts_event?: number;
  user_agent?: string;
  reason?: string; // Motivo de erro
  error?: string; // Erro
}

@Controller('webhooks')
export class BrevoWebhookController {
  private readonly logger = new Logger(BrevoWebhookController.name);

  constructor(private logNotificationService: LogNotificacaoService) {}

  /**
   * Endpoint principal do webhook do Brevo
   */
  @Post('brevo')
  @HttpCode(200)
  async handleBrevoWebhook(@Body() body: any) {
    try {
      // Payload pode vir direto ou dentro de "payload"
      const payload: BrevoWebhookPayload = body.payload || body;

      // Ignorar eventos que não precisamos monitorar (ex: click, se não quiser)
      if (!payload.event) return { status: 'ignored' };

      const logId = this.extrairLogIdDasTags(payload);
      if (!logId) {
        this.logger.warn(
          `⚠️ Tag "log-X" não encontrada. Evento: ${payload.event}`,
        );
        return { status: 'ignored', reason: 'no_tag' };
      }

      const novoStatus = BREVO_EVENT_TO_STATUS[payload.event];

      if (!novoStatus) {
        // Evento desconhecido ou irrelevante
        return { status: 'ignored', event: payload.event };
      }

      // Extrair Data
      let dataEvento = new Date();
      if (payload.ts_event) dataEvento = new Date(payload.ts_event * 1000);
      else if (payload.date) dataEvento = new Date(payload.date);

      // Chamar o serviço com dados limpos
      await this.logNotificationService.atualizarStatusPorEvento(logId, {
        status: novoStatus,
        eventoOriginal: payload.event,
        dataEvento: dataEvento,
        motivo: payload.reason || payload.error, // Captura motivo de falha/bounce
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`❌ Erro webhook: ${error.message}`, error.stack);
      // Retornar 200 para evitar retry infinito do Brevo em caso de erro de lógica nossa
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Extrai o ID do log das tags
   */
  private extrairLogIdDasTags(payload: BrevoWebhookPayload): number | null {
    let tags: string[] = [];
    if (payload.tags && Array.isArray(payload.tags)) {
      tags = payload.tags;
    } else if (payload.tag && typeof payload.tag === 'string') {
      try {
        tags = JSON.parse(payload.tag);
      } catch (e) {
        log(e);
      }
    }

    const logTag = tags.find((t) => t && t.startsWith('log-'));
    if (!logTag) return null;

    const logId = parseInt(logTag.split('-')[1], 10);
    return isNaN(logId) ? null : logId;
  }

  /**
   * Endpoint de teste
   */
  @Get('test')
  @HttpCode(200)
  async test() {
    this.logger.log('🧪 Teste de endpoint de webhook');

    return {
      status: 'ok',
      message: 'Endpoint de webhooks do Brevo está funcionando',
      timestamp: new Date().toISOString(),
      eventosSuportados: Object.keys(BREVO_EVENT_TO_STATUS),
    };
  }
}
