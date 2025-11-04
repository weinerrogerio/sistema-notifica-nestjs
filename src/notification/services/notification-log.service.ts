import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from '@app/tracking/tracking.service';
import { EmailService } from './notification-email.service';
import { LogNotificationQueryService } from '@app/log-notificacao/services/log-notification-search.service';
import { ContatoTabelionatoService } from '@app/contato-tabelionato/contato-tabelionato.service';
import { SendNotification } from '../dto/send-notification.dto';
import {
  NotificationResult,
  NotificationResultAll,
} from '@app/common/interfaces/notification-data.interface';

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

  async sendNotificationsWithTracking(): Promise<NotificationResultAll> {
    // Uma única consulta que já traz todos os dados necessários para o envio
    const intimacoesPendentes =
      await this.logNotificationQueryService.buscarNotificacoesPendentesNaoEnviadas();

    const resultados: NotificationResultAll = {
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
    dadosRequisicao: SendNotification,
  ): Promise<NotificationResult> {
    try {
      // 1. Buscar dados completos
      const dadosCompletos =
        await this.logNotificationQueryService.buscarNotificacaoPendenteAllDataById(
          dadosRequisicao.logNotificacaoId,
        );

      // 2. Validar se encontrou dados
      if (!dadosCompletos || dadosCompletos.length === 0) {
        const errorMessage = `Notificação não encontrada para ID: ${dadosRequisicao.logNotificacaoId}`;
        this.logger.error(errorMessage);
        return { success: false, message: errorMessage };
      }

      const dados = dadosCompletos[0];

      // 3. Validar dados essenciais
      if (!dados.devedor?.email) {
        const errorMessage = 'Email do devedor não encontrado';
        this.logger.error(errorMessage);
        return { success: false, message: errorMessage };
      }

      if (!dados.protesto?.cart_protesto) {
        const errorMessage = 'Cartório de protesto não encontrado';
        this.logger.error(errorMessage);
        return { success: false, message: errorMessage };
      }

      // 4. Buscar dados do cartório
      const dadosCartorio = await this.contatoTabelionatoService.findOneByName(
        dados.protesto.cart_protesto,
      );

      // 5. Gerar e armazenar o token
      const token = await this.trackingService.generateAndStoreToken(dados.id);

      // 6. Criar URLs
      const baseUrl = this.configService.get<string>('BASE_URL');
      const trackingPixelUrl = `${baseUrl}/tracking/pixel/${token}`;

      // 7. Log detalhado para debug
      this.logger.log(`Preparando envio para: ${dados.devedor.email}`);
      this.logger.log(`Token gerado: ${token}`);
      this.logger.log(`Tracking URL: ${trackingPixelUrl}`);

      // 8. Enviar email com tracking
      const emailResult = await this.emailService.sendNotificationWithTracking(
        dados,
        trackingPixelUrl,
        dadosCartorio,
      );

      // 9. Atualizar status se enviado com sucesso
      if (emailResult.success) {
        await this.logNotificationQueryService.marcarComoEnviada(
          dados.id,
          emailResult.templateId, // Passa o ID do template
        );
        this.logger.log(
          `Notificação enviada e marcada como enviada para ID: ${dados.id} com Template ID: ${emailResult.templateId}`, // Log atualizado
        );
        this.logger.log(
          `✅ Email enviado com sucesso para ${dados.devedor.email}`,
        );
        // INFORMAR O USUARIO QUE A NOTIFICACAO NAO FOI ENVIADA NO FRONT END---> front end tem acesso aos dados de quem esta enviando a notificacao
        return {
          success: true,
          message: `Notificação enviada com sucesso`,
        };
      } else {
        this.logger.error(
          `❌ Falha no envio do email para ${dados.devedor.email}`,
        );

        // INFORMAR O USUARIO QUE A NOTIFICACAO NAO FOI ENVIADA NO FRONT END---> front end tem acesso aos dados de quem esta enviando a notificacao
        const errorMessage = `Falha no envio da notificação `;
        this.logger.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = `Erro ao enviar notificação: ${
        error instanceof Error ? error.message : 'Erro desconhecido'
      }`;

      this.logger.error(
        `Erro ao enviar notificação com tracking para ID ${dadosRequisicao.logNotificacaoId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      return { success: false, message: errorMessage };
    }
  }
}
