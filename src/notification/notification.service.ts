// No seu notification.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import {
  ContatoTabelionato,
  EmailOptions,
  IntimacaoData,
} from '@app/common/interfaces/notification-data.interface';

import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { NotificationTemplate } from './templates/notification.template';

@Injectable()
export class NotificationService {
  private transporter: Transporter;
  private readonly logger = new Logger(NotificationService.name);
  private readonly contatoTabelionato: ContatoTabelionato;

  constructor(
    private configService: ConfigService,
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    // Dados o cartorio (pode vir do banco futuramente)
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

  // Buscar notificações não enviadas de devedores que possuem email
  async buscarNotificacoesPendentes(): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('devedor.email IS NOT NULL')
      .andWhere('devedor.email != :emptyEmail', { emptyEmail: '' })
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Versão corrigida da sua função original
  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto') // Corrigido: protesto, não docProtesto
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('devedor.nome = :devedorNome', { devedorNome })
      .andWhere('protesto.num_distribuicao = :numDistribuicaoProtesto', {
        numDistribuicaoProtesto,
      })
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Buscar notificações por devedor específico (que ainda não foram enviadas)
  async buscarNotificacoesPendentesPorDevedor(
    devedorId: number,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('devedor.id = :devedorId', { devedorId })
      .andWhere('devedor.email IS NOT NULL')
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Buscar notificações por número de distribuição (não enviadas)
  async buscarNotificacoesPendentesPorDistribuicao(
    numDistribuicao: string,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('protesto.num_distribuicao = :numDistribuicao', {
        numDistribuicao,
      })
      .andWhere('devedor.email IS NOT NULL')
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Função auxiliar para mapear os dados
  private mapearParaIntimacaoData(
    logNotificacoes: LogNotificacao[],
  ): IntimacaoData[] {
    return logNotificacoes.map((logNotificacao) => {
      // Obter o primeiro credor associado ao protesto
      const primeiroCredor = logNotificacao.protesto?.credores?.[0]?.credor;

      // Determinar o nome do credor (prioritariamente cedente, depois sacador)
      let nomeCredor = 'Não informado';
      if (primeiroCredor) {
        nomeCredor =
          primeiroCredor.cedente || primeiroCredor.sacador || 'Não informado';
      }

      return {
        nomeDevedor: logNotificacao.devedor?.nome || '',
        devedorEmail: logNotificacao.devedor?.email || '',
        docDevedor: logNotificacao.devedor?.doc_devedor || '',
        distribuicao: logNotificacao.protesto?.num_distribuicao || '',
        dataDistribuicao:
          logNotificacao.protesto?.data_distribuicao || new Date(),
        valorTotal: logNotificacao.protesto?.valor || 0, // Usando o campo valor do protesto
        dataVencimento: logNotificacao.protesto?.vencimento || '',
        tabelionato: logNotificacao.protesto?.cart_protesto || '',
        // Para o credor, pegamos o cedente ou sacador do primeiro credor
        credor: nomeCredor,
        // Para o portador, pegamos o nome do apresentante
        portador:
          logNotificacao.protesto?.apresentante?.nome || 'Não informado',
      };
    });
  }

  // Função para marcar notificações como enviadas
  async marcarComoEnviada(logNotificacaoId: number): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoId, {
      email_enviado: true,
      data_envio: new Date(),
    });
  }

  // Função para marcar múltiplas notificações como enviadas
  async marcarMultiplasComoEnviadas(
    logNotificacaoIds: number[],
  ): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoIds, {
      email_enviado: true,
      data_envio: new Date(),
    });
  }

  // Buscar todas as notificações com paginação
  async buscarNotificacoesComPaginacao(
    page: number = 1,
    limit: number = 10,
    filtros?: {
      emailEnviado?: boolean;
      devedorComEmail?: boolean;
      dataInicio?: Date;
      dataFim?: Date;
    },
  ): Promise<{
    dados: IntimacaoData[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const queryBuilder = this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor');

    // Aplicar filtros se fornecidos
    if (filtros?.emailEnviado !== undefined) {
      queryBuilder.andWhere('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: filtros.emailEnviado,
      });
    }

    if (filtros?.devedorComEmail) {
      queryBuilder.andWhere('devedor.email IS NOT NULL');
      queryBuilder.andWhere('devedor.email != :emptyEmail', { emptyEmail: '' });
    }

    if (filtros?.dataInicio) {
      queryBuilder.andWhere('log_notificacao.createdAt >= :dataInicio', {
        dataInicio: filtros.dataInicio,
      });
    }

    if (filtros?.dataFim) {
      queryBuilder.andWhere('log_notificacao.createdAt <= :dataFim', {
        dataFim: filtros.dataFim,
      });
    }

    // Contar total de registros
    const total = await queryBuilder.getCount();

    // Aplicar paginação
    const logNotificacoes = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('log_notificacao.createdAt', 'DESC')
      .getMany();

    const dados = this.mapearParaIntimacaoData(logNotificacoes);
    const totalPaginas = Math.ceil(total / limit);

    return {
      dados,
      total,
      pagina: page,
      totalPaginas,
    };
  }

  // ------------------------------------- envio de emails ------------------------------------- //
  // ALERTA --> PARA O ENVIO CORRETO DO EMAIL O SERVIDOR DE DOMINIO TEM DE ESTAR CONFIGURADO CORRETAMENTE(SPF, DKIM e DMARC no DNS DO DOMINIO)
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado para: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`);
      return false;
    }
  }

  // ENVIA UMA NOTIFICAÇÃO
  async sendNotification(dados: IntimacaoData): Promise<boolean> {
    const html = NotificationTemplate.gerar(dados, this.contatoTabelionato);

    return this.sendEmail({
      to: dados.devedorEmail,
      subject: 'Intimação de Protesto',
      html,
    });
  }

  //ENVIA MULTIPLOS EMAILS
  async sendNotifications(dados: IntimacaoData[]): Promise<void> {
    for (const intimacao of dados) {
      await this.sendNotification(intimacao);
    }
  }
}
