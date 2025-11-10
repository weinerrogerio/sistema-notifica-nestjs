import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  ContatoTabelionatoInterface,
  EmailOptions,
  NotificationData,
} from '@app/common/interfaces/notification-data.interface';
import { TemplateService } from '@app/template/template.service';

import * as fs from 'fs'; // Importe o módulo 'fs' do Node.js
import * as path from 'path'; // Importe o módulo 'path'

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly contatoTabelionato: ContatoTabelionatoInterface;

  constructor(
    private configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
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
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: options.from,
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
          'List-Unsubscribe': `<mailto:${options.to}?subject=Unsubscribe>`,
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
  async sendNotificationWithTracking(
    data: NotificationData,
  ): Promise<{ success: boolean; templateId: number | null }> {
    try {
      this.logger.log(
        `Iniciando envio de email com tracking para: ${data.devedor.email}`,
      );
      this.logger.log(`🔗 Tracking URL: ${data.urls.trackingPixel}`);

      // 1. Validações básicas
      if (!data.devedor?.email) {
        this.logger.error('Email do devedor não fornecido');
        return { success: false, templateId: null };
      }

      if (!data.urls.trackingPixel) {
        this.logger.error('URL do tracking pixel não fornecida');
        return { success: false, templateId: null };
      }

      // 2. Validar dados do cartório
      if (!data.cartorio) {
        this.logger.error('Dados do cartório não fornecidos');
        return { success: false, templateId: null };
      }

      // 3. Carrega o template PADRÃO do DB
      const templateDB = await this.templateService.getDefaultTemplate();

      if (!templateDB?.conteudoHtml) {
        this.logger.error(
          'Template padrão não encontrado ou sem conteúdo HTML',
        );
        return { success: false, templateId: null };
      }

      // 4. Log detalhado dos dados
      console.log('📧 DADOS PARA ENVIO:');
      console.log('🔍 Dados completos:', JSON.stringify(data, null, 2));
      console.log(
        '🏢 Contato Tabelionato:',
        JSON.stringify(data.cartorio, null, 2),
      );
      console.log('🔗 Tracking Pixel URL:', data.urls.trackingPixel);

      // 5. Renderiza o template com os dados E o tracking pixel
      const html = await this.templateService.renderTemplate(
        templateDB.conteudoHtml,
        data,
      );

      if (!html) {
        this.logger.error('Falha na renderização do template HTML');
        return { success: false, templateId: null };
      }

      // ---- SALVAR O HTML EM UM ARQUIVO TEMPORÁRIO PARA VISUALIZAÇÃO -- RETIRAR DEPOIS--------------------
      const filePath = path.join(
        process.cwd(),
        'temp',
        `email_preview_${data.distribuicao.numero}.html`,
      ); // Ou dados.logNotificacaoId
      try {
        // Garante que o diretório 'temp' exista
        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        fs.writeFileSync(filePath, html, 'utf8');
        this.logger.log(
          `HTML do email salvo para visualização em: ${filePath}`,
        );
      } catch (fileError) {
        this.logger.error(`Erro ao salvar arquivo HTML: ${fileError.message}`);
      }
      //-----------------------------------------------------------------------------------------------------

      // 6. Prepara o assunto do email
      const subject = `Intimação de Protesto - ${data.devedor.nome || 'Devedor'} - Título: ${data.titulo.numero || 'N/A'}`;

      // 7. Determinar o remetente (verificar qual propriedade existe)
      console.log(
        `Dados para sendEmail - Para: ${data.devedor.email}, De: ${data.cartorio.nome}`,
      );

      // 8. Envia o email
      const result = await this.sendEmail({
        to: data.devedor.email,
        subject: subject,
        html: html,
        from: data?.cartorio?.nome || 'Sistema de Notificações',
      });
      //const result = false;
      console.log(subject);

      //return result;
      return { success: result, templateId: result ? templateDB.id : null };
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação com tracking para ${data.devedor?.email}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: false, templateId: null };
    }
  }
}
