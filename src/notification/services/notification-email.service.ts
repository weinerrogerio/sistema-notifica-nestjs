import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from '@getbrevo/brevo';
import { NotificationData } from '@app/common/interfaces/notification-data.interface';
import { TemplateService } from '@app/template/template.service';
import { NotificacaoStatus } from '@app/log-notificacao/entities/log-notificacao.entity';
import { PersonalConfigService } from '@app/config/config.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private brevoApiInstance: TransactionalEmailsApi;

  constructor(
    private configService: ConfigService,
    private personalConfigService: PersonalConfigService,
    private readonly templateService: TemplateService,
  ) {
    // Configuração do Brevo ou outro serviço
    this.brevoApiInstance = new TransactionalEmailsApi();
  }

  async onModuleInit() {
    const configDb = await this.personalConfigService.findOne(1);

    const apiKey =
      configDb?.EXTERNAL_SERVICE_API_KEY ??
      this.configService.get<string>('EXTERNAL_SERVICE_API_KEY');

    if (apiKey) {
      this.brevoApiInstance.setApiKey(
        TransactionalEmailsApiApiKeys.apiKey,
        apiKey,
      );
      this.logger.log('✅ Brevo API configurada com sucesso');
    } else {
      this.logger.error('❌ EXTERNAL_SERVICE_API_KEY não configurada!');
      // por enquanto apenas loga, sem travar - podemos tratar depois
    }
  }

  /**
   * Envia notificação por email via Brevo
   */
  async sendNotification(data: NotificationData): Promise<{
    success: boolean;
    messageId?: string;
    status?: NotificacaoStatus;
    error?: string;
  }> {
    try {
      this.logger.log(
        `📧 Iniciando envio via Brevo para: ${data.devedor.email} (Log ID: ${data.metadata?.notificacaoId})`,
      );

      // 1. Validar e renderizar template HTML
      const htmlRenderizado = await this.renderizarTemplate(data);

      // 2. Configurar email
      const sendSmtpEmail = this.configurarEmail(data, htmlRenderizado);

      // 3. Enviar via Brevo
      const response =
        await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);

      const messageId = response.body.messageId;

      this.logger.log(
        `✅ Email enviado com sucesso! Message ID: ${messageId} | Log ID: ${data.metadata?.notificacaoId}`,
      );

      return {
        success: true,
        messageId,
        status: NotificacaoStatus.ENVIADO,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email (Log ID: ${data.metadata?.notificacaoId})`,
        error.stack,
      );

      // Extrair mensagem de erro detalhada
      const errorMessage = this.extrairMensagemErro(error);

      return {
        success: false,
        error: errorMessage,
        status: NotificacaoStatus.FALHA,
      };
    }
  }

  /**
   * Renderiza o template HTML com os dados
   */
  private async renderizarTemplate(data: NotificationData): Promise<string> {
    // Buscar template padrão do banco
    const templateDB = await this.templateService.getDefaultTemplate();

    if (!templateDB?.conteudoHtml) {
      throw new Error('Template padrão não encontrado no banco de dados');
    }

    // Renderizar template substituindo variáveis
    // Ex: {{devedor.nome}} vira "João Silva"
    const htmlRenderizado = await this.templateService.renderTemplate(
      templateDB.conteudoHtml,
      data,
    );

    return htmlRenderizado;
  }

  /**
   * Configura o objeto de email para envio
   */
  private configurarEmail(
    data: NotificationData,
    htmlContent: string,
  ): SendSmtpEmail {
    const sendSmtpEmail = new SendSmtpEmail();

    // Assunto
    sendSmtpEmail.subject = this.gerarAssunto(data);

    // Conteúdo HTML
    sendSmtpEmail.htmlContent = htmlContent;

    // Headers para tracking
    sendSmtpEmail.headers = {
      'X-Sib-Default-Track-Opens': '1', // Rastreamento de abertura
      'X-Sib-Default-Track-Clicks': '1', // Rastreamento de cliques
    };

    // Remetente
    sendSmtpEmail.sender = {
      name: data.cartorio.nome,
      email: this.configService.get<string>('BREVO_SENDER_EMAIL'),
    };

    // Destinatário
    sendSmtpEmail.to = [
      {
        email: data.devedor.email,
        name: data.devedor.nome,
      },
    ];

    // Tags para rastreamento (CRÍTICO para o webhook funcionar)
    const logIdTag = `log-${data.metadata?.notificacaoId}`;
    sendSmtpEmail.tags = [logIdTag, 'intimacao-protesto'];

    this.logger.debug(
      `📌 Tags configuradas: ${JSON.stringify(sendSmtpEmail.tags)}`,
    );

    return sendSmtpEmail;
  }

  /**
   * Gera assunto personalizado do email
   */
  private gerarAssunto(data: NotificationData): string {
    return `Intimação de Protesto - ${data.devedor.nome} - Título: ${data.titulo.numero}`;
  }

  /**
   * Extrai mensagem de erro amigável
   */
  private extrairMensagemErro(error: any): string {
    // Erro do Brevo
    if (error.body) {
      try {
        const errorBody = JSON.parse(error.body);
        return (
          errorBody.message || errorBody.code || 'Erro desconhecido do Brevo'
        );
      } catch (e) {
        console.log(e);
        return error.body.toString();
      }
    }

    // Erro HTTP
    if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }

    // Erro genérico
    return error.message || 'Erro desconhecido ao enviar email';
  }

  /**
   * Valida se o email é válido (formato básico)
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Envia email com validação prévia
   */
  async sendNotificationComValidacao(data: NotificationData): Promise<{
    success: boolean;
    messageId?: string;
    status?: NotificacaoStatus;
    error?: string;
  }> {
    // Validar email antes de enviar
    if (!data.devedor.email || !this.validarEmail(data.devedor.email)) {
      this.logger.warn(
        `⚠️ Email inválido: ${data.devedor.email} (Log ID: ${data.metadata?.notificacaoId})`,
      );

      return {
        success: false,
        error: 'Email inválido ou não informado',
        status: NotificacaoStatus.BOUNCE,
      };
    }

    // Validar dados essenciais
    if (!data.devedor.nome || !data.titulo.numero) {
      this.logger.warn(
        `⚠️ Dados incompletos (Log ID: ${data.metadata?.notificacaoId})`,
      );

      return {
        success: false,
        error: 'Dados essenciais não informados',
        status: NotificacaoStatus.FALHA,
      };
    }

    // Enviar email
    return this.sendNotification(data);
  }
}
