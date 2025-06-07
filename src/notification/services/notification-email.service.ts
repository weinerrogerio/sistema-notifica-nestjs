import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  ContatoTabelionato,
  EmailOptions,
  IntimacaoData,
} from '@app/common/interfaces/notification-data.interface';
import { NotificationTemplate } from '../templates/notification.template';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly contatoTabelionato: ContatoTabelionato;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true para 465, false para outras portas
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      // Configurações adicionais para melhorar deliverability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000, // 20 segundos
      rateLimit: 5, // máximo 5 emails por rateDelta
    });

    // Configuração do contato do tabelionato
    this.contatoTabelionato = {
      nomeTabelionato:
        this.configService.get<string>('COMPANY_NAME') || 'Sua Empresa LTDA',
      telefone:
        this.configService.get<string>('COMPANY_PHONE') || '(11) 9999-9999',
      email:
        this.configService.get<string>('COMPANY_EMAIL') ||
        'contato@empresa.com',
      endereco: 'Rua Exemplo, 123 - Centro - Curitiba/PR',
    };
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: this.contatoTabelionato.nomeTabelionato,
          address:
            this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER'),
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        // Headers importantes para deliverability e tracking
        headers: {
          'X-Mailer': 'NotificationService',
          'X-Priority': '1', // Alta prioridade
          Importance: 'high',
          'X-MSMail-Priority': 'High',
          // Header para permitir imagens
          'Content-Type': 'text/html; charset=UTF-8',
          // Anti-spam headers
          'List-Unsubscribe': `<mailto:${this.contatoTabelionato.email}?subject=Unsubscribe>`,
          'List-Id': 'Intimacoes de Protesto',
        },
        // Configurações de tracking
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }, // Usar nosso próprio tracking
        },
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email enviado com sucesso: ${info.messageId}`);
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`, error.stack);
      return false;
    }
  }

  async sendNotification(dados: IntimacaoData): Promise<boolean> {
    const html = NotificationTemplate.gerar(dados, this.contatoTabelionato);

    return this.sendEmail({
      to: dados.devedorEmail,
      subject: 'Intimação de Protesto',
      html,
    });
  }

  async sendNotificationWithTracking(
    dados: IntimacaoData,
    trackingPixelUrl: string,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Enviando email com tracking para: ${dados.devedorEmail}`,
      );
      this.logger.log(`🔗 Tracking URL: ${trackingPixelUrl}`);

      // Gerar HTML com tracking
      const html = NotificationTemplate.gerar(
        dados,
        this.contatoTabelionato,
        trackingPixelUrl,
      );

      // Enviar email
      const success = await this.sendEmail({
        to: dados.devedorEmail,
        subject: 'Intimação de Protesto - Ação Requerida',
        html,
      });

      if (success) {
        this.logger.log(`Email enviado com sucesso para ${dados.devedorEmail}`);
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação com tracking: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendBulkNotifications(dados: IntimacaoData[]): Promise<void> {
    for (const intimacao of dados) {
      await this.sendNotification(intimacao);
    }
  }

  getContatoTabelionato(): ContatoTabelionato {
    return this.contatoTabelionato;
  }
}
