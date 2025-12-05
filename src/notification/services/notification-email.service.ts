import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from '@getbrevo/brevo';
import { NotificationData } from '@app/common/interfaces/notification-data.interface';
import { TemplateService } from '@app/template/template.service';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private brevoApiInstance: TransactionalEmailsApi;

  constructor(
    private configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    // Configuração Inicial do Brevo
    this.brevoApiInstance = new TransactionalEmailsApi();
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    if (apiKey) {
      this.brevoApiInstance.setApiKey(
        TransactionalEmailsApiApiKeys.apiKey,
        apiKey,
      );
    } else {
      this.logger.error('BREVO_API_KEY não configurada!');
    }
  }

  async sendNotification(
    data: NotificationData,
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      this.logger.log(`Iniciando envio via Brevo para: ${data.devedor.email}`);

      // 1. Validar e Renderizar HTML (Renderização Local)
      const templateDB = await this.templateService.getDefaultTemplate();
      if (!templateDB?.conteudoHtml) {
        throw new Error('Template padrão não encontrado');
      }

      // AQUI acontece a mágica: {{devedor.nome}} vira "João" ANTES de ir pro Brevo
      const htmlRenderizado = await this.templateService.renderTemplate(
        templateDB.conteudoHtml,
        data,
      );

      // 2. Configurar o Objeto de Envio do Brevo
      const sendSmtpEmail = new SendSmtpEmail();

      sendSmtpEmail.subject = `Intimação de Protesto - ${data.devedor.nome} - Título: ${data.titulo.numero}`;
      sendSmtpEmail.htmlContent = htmlRenderizado;

      sendSmtpEmail.sender = {
        name: data.cartorio.nome,
        email: this.configService.get<string>('BREVO_SENDER_EMAIL'), // Email validado no Brevo
      };

      sendSmtpEmail.to = [
        {
          email: data.devedor.email,
          name: data.devedor.nome,
        },
      ];

      // 3. RASTREAMENTO (O Pulo do Gato)
      // Adicionamos uma TAG com o ID. O Webhook vai nos devolver essa tag quando abrir.
      // Formato: "log-12345"
      const logIdTag = `log-${data.metadata?.notificacaoId}`;
      sendSmtpEmail.tags = [logIdTag, 'intimacao-protesto'];

      // 4. Enviar
      const response =
        await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);

      this.logger.log(`Email enviado Brevo! ID: ${response.body.messageId}`);

      return { success: true, messageId: response.body.messageId };
    } catch (error) {
      this.logger.error(
        `Erro Brevo envio: ${error.body ? JSON.stringify(error.body) : error.message}`,
        error.stack,
      );
      return { success: false };
    }
  }
}
