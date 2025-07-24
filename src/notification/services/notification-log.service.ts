import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from '@app/tracking/tracking.service';
import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';
import { EmailService } from './notification-email.service';
import { NotificationResult } from '../interfaces/notification.interface';
import { LogNotificationQueryService } from '@app/log-notificacao/services/log-notification-search.service';
import { ContatoTabelionatoService } from '@app/contato-tabelionato/contato-tabelionato.service';

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    private trackingService: TrackingService,
    private configService: ConfigService,
    private logNotificationQueryService: LogNotificationQueryService,
    private emailService: EmailService,
    private contatoTabelionatoService: ContatoTabelionatoService,
  ) {}

  async sendNotificationsWithTracking(): Promise<NotificationResult> {
    // Uma única consulta que já traz todos os dados necessários para o envio
    const intimacoesPendentes =
      await this.logNotificationQueryService.buscarNotificacoesPendentesNaoEnviadas();

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

  //sendOneNotificationTeste
  async sendOneNotificationTeste(
    dadosRequisicao: IntimacaoData,
  ): Promise<boolean> {
    try {
      // 1. Buscar dados completos
      const dadosCompletos =
        await this.logNotificationQueryService.buscarNotificacaoPendenteAllDataById(
          dadosRequisicao.logNotificacaoId,
        );

      // 2. Validar se encontrou dados
      if (!dadosCompletos || dadosCompletos.length === 0) {
        this.logger.error(
          `Notificação não encontrada para ID: ${dadosRequisicao.logNotificacaoId}`,
        );
        return false;
      }

      const dados = dadosCompletos[0];

      // 3. Validar dados essenciais
      if (!dados.devedor?.email) {
        this.logger.error('Email do devedor não encontrado');
        return false;
      }

      if (!dados.protesto?.cart_protesto) {
        this.logger.error('Cartório de protesto não encontrado');
        return false;
      }

      // 4. Buscar dados do cartório
      const dadosCartorio = await this.contatoTabelionatoService.findOneByName(
        dados.protesto.cart_protesto,
      );

      // 5. Gerar e armazenar o token
      const token = await this.trackingService.generateAndStoreToken(dados.id);

      // 6. Criar URLs
      const baseUrl =
        this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      const trackingPixelUrl = `${baseUrl}/tracking/pixel/${token}`;

      // 7. Log detalhado para debug
      this.logger.log(`Preparando envio para: ${dados.devedor.email}`);
      this.logger.log(`Token gerado: ${token}`);
      this.logger.log(`Tracking URL: ${trackingPixelUrl}`);

      // 8. Enviar email com tracking
      const success = await this.emailService.sendNotificationWithTrackingTeste(
        dados,
        trackingPixelUrl,
        dadosCartorio,
      );

      // 9. Atualizar status se enviado com sucesso
      if (success) {
        await this.logNotificationQueryService.marcarComoEnviada(dados.id);
        this.logger.log(
          `Notificação enviada e marcada como enviada para ID: ${dados.id}`,
        );
      } else {
        this.logger.error(`Falha no envio da notificação para ID: ${dados.id}`);
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação com tracking para ID ${dadosRequisicao.logNotificacaoId}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
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
