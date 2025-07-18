import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from '@app/tracking/tracking.service';
import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';
import { EmailService } from './notification-email.service';
import { NotificationResult } from '../interfaces/notification.interface';
import { LogNotificationQueryService } from '@app/log-notificacao/services/log-notification-search.service';

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    private trackingService: TrackingService,
    private configService: ConfigService,
    private logNotificationQueryService: LogNotificationQueryService,
    private emailService: EmailService,
  ) {}

  async sendNotificationsWithTracking(): Promise<NotificationResult> {
    // Uma única consulta que já traz todos os dados necessários para o envio
    const intimacoesPendentes =
      await this.logNotificationQueryService.buscarNotificacoesPendentes();

    const resultados: NotificationResult = {
      enviados: 0,
      erros: 0,
      detalhes: [],
    };

    for (const intimacao of intimacoesPendentes) {
      try {
        // PARA TESTES O EMAIL DO DEVEDOR PJ TEM QUE ESER ALGUM EMAIL PARTIULAR
        // VERIFICAÇÃO SE O EMAIL É DE UM PJ VALIDO--> SE FOR NAO ENVIA --> ALERTA
        if (intimacao.devedorEmail !== '') {
        }

        const sucesso = await this.sendOneNotificationWithTracking(intimacao);

        if (sucesso) {
          resultados.enviados++;
          resultados.detalhes.push({
            id: intimacao.logNotificacaoId,
            email: intimacao.devedorEmail,
            sucesso: true,
          });
        } else {
          resultados.erros++;
          resultados.detalhes.push({
            id: intimacao.logNotificacaoId,
            email: intimacao.devedorEmail,
            sucesso: false,
            erro: 'Falha no envio do email',
          });
        }
      } catch (error) {
        resultados.erros++;
        resultados.detalhes.push({
          id: intimacao.logNotificacaoId,
          email: intimacao.devedorEmail,
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    this.logger.log(
      `Envio concluído: ${resultados.enviados} enviados, ${resultados.erros} erros`,
    );
    return resultados;
  }

  async sendOneNotificationWithTracking(
    dados: IntimacaoData,
  ): Promise<boolean> {
    try {
      // Gerar e armazenar o token
      const token = await this.trackingService.generateAndStoreToken(
        dados.logNotificacaoId,
      );

      // Criar URLs (usar HTTPS se possível)
      const baseUrl =
        this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      const trackingPixelUrl = `${baseUrl}/tracking/pixel/${token}`;

      // Enviar email com tracking
      const success = await this.emailService.sendNotificationWithTracking(
        dados,
        trackingPixelUrl,
      );

      if (success) {
        // Atualizar log que email foi enviado
        await this.logNotificationQueryService.marcarComoEnviada(
          dados.logNotificacaoId,
        );
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação com tracking: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  async sendSimpleNotification(dados: IntimacaoData): Promise<boolean> {
    return this.emailService.sendNotification(dados);
  }

  async sendBulkNotifications(dados: IntimacaoData[]): Promise<void> {
    return this.emailService.sendBulkNotifications(dados);
  }
}
