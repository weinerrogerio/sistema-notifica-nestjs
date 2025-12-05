import { Controller, Post, Body, Logger, HttpCode, Get } from '@nestjs/common';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';

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
}

@Controller('webhooks')
export class BrevoWebhookController {
  private readonly logger = new Logger(BrevoWebhookController.name);

  constructor(private logNotificationService: LogNotificacaoService) {}

  @Post('brevo')
  @HttpCode(200)
  async handleBrevoWebhook(@Body() body: any) {
    try {
      // O payload pode vir direto ou dentro de uma propriedade "payload"
      const payload: BrevoWebhookPayload = body.payload || body;

      this.logger.log(
        `📧 Webhook recebido do Brevo: ${JSON.stringify(payload)}`,
      );

      // 1. Verificar se é um evento de abertura
      // O Brevo pode enviar diferentes tipos de evento: "unique_proxy_open", "opened", "clicks", etc.
      const eventosDeAbertura = ['unique_proxy_open', 'opened', 'proxy_open'];

      if (!eventosDeAbertura.includes(payload.event)) {
        this.logger.log(
          `⏭️  Evento "${payload.event}" ignorado (não é abertura de e-mail)`,
        );
        return { status: 'ignored', reason: 'not_an_open_event' };
      }

      // 2. Extrair as tags (pode vir como string JSON ou array)
      let tags: string[] = [];

      if (payload.tags && Array.isArray(payload.tags)) {
        tags = payload.tags;
      } else if (payload.tag && typeof payload.tag === 'string') {
        try {
          tags = JSON.parse(payload.tag);
        } catch (e) {
          this.logger.warn(
            `⚠️  Não foi possível fazer parse das tags: ${payload.tag} - ${e.message}  `,
          );
        }
      }

      this.logger.log(`🏷️  Tags encontradas: ${JSON.stringify(tags)}`);

      // 3. Procurar a tag que contém o ID da notificação (formato: "log-123")
      const logTag = tags.find((t: string) => t && t.startsWith('log-'));

      if (!logTag) {
        this.logger.warn(
          '⚠️  Tag "log-X" não encontrada no webhook. Tags recebidas:',
          tags,
        );
        return { status: 'error', reason: 'log_tag_not_found' };
      }

      // 4. Extrair o ID da notificação
      const idString = logTag.split('-')[1];
      const logId = parseInt(idString, 10);

      if (isNaN(logId)) {
        this.logger.error(`❌ ID inválido extraído da tag: ${logTag}`);
        return { status: 'error', reason: 'invalid_log_id' };
      }

      // 5. Obter a data do evento
      // Prioridade: ts_event > ts > date
      let dataLeitura: Date;

      if (payload.ts_event) {
        dataLeitura = new Date(payload.ts_event * 1000);
      } else if (payload.ts) {
        dataLeitura = new Date(payload.ts * 1000);
      } else if (payload.date) {
        dataLeitura = new Date(payload.date);
      } else {
        dataLeitura = new Date(); // Fallback para data atual
      }

      this.logger.log(
        `📖 Notificação ${logId} foi ABERTA! 
        - Evento: ${payload.event}
        - Data: ${dataLeitura.toISOString()}
        - Dispositivo: ${payload.device_used || 'Desconhecido'}
        - User Agent: ${payload.user_agent || 'Desconhecido'}
        Atualizando banco de dados...`,
      );

      // 6. Atualizar no banco de dados
      await this.logNotificationService.marcarComoLida(logId, dataLeitura);

      this.logger.log(`✅ Notificação ${logId} marcada como lida com sucesso!`);

      return {
        status: 'success',
        logId,
        event: payload.event,
        dataLeitura: dataLeitura.toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao processar webhook do Brevo:', error);

      // Retornar 200 mesmo com erro para não gerar retry infinito no Brevo
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  @Get('test')
  @HttpCode(200)
  async test() {
    this.logger.log('🧪 Teste de endpoint de webhook recebido');
    return {
      status: 'ok',
      message: 'Endpoint para webhooks do Brevo funcionando',
      timestamp: new Date().toISOString(),
    };
  }

  // Endpoint adicional para testar a marcação de leitura
  @Post('test-mark-read/:id')
  @HttpCode(200)
  async testMarkRead(@Body() body: { id: number }) {
    try {
      const logId = body.id;
      await this.logNotificationService.marcarComoLida(logId);

      this.logger.log(`✅ Teste: Notificação ${logId} marcada como lida`);

      return {
        status: 'success',
        message: `Notificação ${logId} marcada como lida`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Erro no teste:', error);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
