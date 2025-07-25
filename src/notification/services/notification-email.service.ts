import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  ContatoTabelionatoInterface,
  EmailOptions,
  IntimacaoDataCompleto,
} from '@app/common/interfaces/notification-data.interface';
import { TemplateService } from '@app/template/template.service';
import { ContatoTabelionato } from '@app/contato-tabelionato/entities/contato-tabelionato.entity';

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
    dados: IntimacaoDataCompleto,
    trackingPixelUrl: string,
    contatoTabelionato?: ContatoTabelionato,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Iniciando envio de email com tracking para: ${dados.devedor.email}`,
      );
      this.logger.log(`🔗 Tracking URL: ${trackingPixelUrl}`);

      // 1. Validações básicas
      if (!dados.devedor?.email) {
        this.logger.error('Email do devedor não fornecido');
        return false;
      }

      if (!trackingPixelUrl) {
        this.logger.error('URL do tracking pixel não fornecida');
        return false;
      }

      // 2. Validar dados do cartório
      if (!contatoTabelionato) {
        this.logger.error('Dados do cartório não fornecidos');
        return false;
      }

      // 3. Carrega o template do DB
      const templateDB = await this.templateService.getDefaultTemplate();

      if (!templateDB?.conteudoHtml) {
        this.logger.error(
          'Template padrão não encontrado ou sem conteúdo HTML',
        );
        return false;
      }

      // 4. Log detalhado dos dados (corrigido)
      console.log('📧 DADOS PARA ENVIO:');
      console.log('🔍 Dados completos:', JSON.stringify(dados, null, 2));
      console.log(
        '🏢 Contato Tabelionato:',
        JSON.stringify(contatoTabelionato, null, 2),
      );
      console.log('🔗 Tracking Pixel URL:', trackingPixelUrl);

      // 5. Renderiza o template com os dados E o tracking pixel
      const html = await this.templateService.renderTemplate(
        templateDB.conteudoHtml,
        dados,
        trackingPixelUrl,
        contatoTabelionato,
      );

      if (!html) {
        this.logger.error('Falha na renderização do template HTML');
        return false;
      }

      // ---- SALVAR O HTML EM UM ARQUIVO TEMPORÁRIO PARA VISUALIZAÇÃO -- RETIRAR DEPOIS-----
      const filePath = path.join(
        process.cwd(),
        'temp',
        `email_preview_${dados.id}.html`,
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
      //-------------------------------------------------------------

      // 6. Prepara o assunto do email
      const subject = `Intimação de Protesto - ${dados.devedor.nome || 'Devedor'} - Título: ${dados.protesto.num_titulo || 'N/A'}`;

      // 7. Determinar o remetente (verificar qual propriedade existe)

      console.log(
        `Dados para sendEmail - Para: ${dados.devedor.email}, De: ${contatoTabelionato.nomeTabelionato}`,
      );

      // 8. Envia o email
      const success = await this.sendEmail({
        to: dados.devedor.email,
        subject: subject,
        html: html,
        from: contatoTabelionato?.nomeTabelionato || 'Sistema de Notificações',
      });

      // 9. Log do resultado
      if (success) {
        this.logger.log(
          `✅ Email enviado com sucesso para ${dados.devedor.email}`,
        );
      } else {
        this.logger.error(
          `❌ Falha no envio do email para ${dados.devedor.email}`,
        );
      }

      return success;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação com tracking para ${dados.devedor?.email}: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
