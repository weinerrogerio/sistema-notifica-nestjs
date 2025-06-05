import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import * as crypto from 'crypto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {}

  /**
   * Gera um token único e DETERMINÍSTICO para rastreamento
   * IMPORTANTE: Sempre retorna o mesmo token para o mesmo ID
   */
  generateTrackingToken(logNotificacaoId: number): string {
    // Usar uma seed fixa baseada apenas no ID para garantir determinismo
    const secretKey = process.env.TRACKING_SECRET_KEY || 'default-secret-key';
    const data = `${logNotificacaoId}-${secretKey}`;

    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Armazena o token de tracking no banco
   */
  async storeTrackingToken(
    logNotificacaoId: number,
    token: string,
  ): Promise<void> {
    this.logger.log(
      `Armazenando token: ${token} para log ID: ${logNotificacaoId}`,
    );

    try {
      await this.logNotificacaoRepository.update(logNotificacaoId, {
        tracking_token: token,
      });

      this.logger.log(
        `Token de tracking armazenado com sucesso para log ID: ${logNotificacaoId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar token de tracking: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gera E armazena o token em uma única operação
   */
  async generateAndStoreToken(logNotificacaoId: number): Promise<string> {
    const token = this.generateTrackingToken(logNotificacaoId);
    await this.storeTrackingToken(logNotificacaoId, token);
    return token;
  }

  /**
   * Registra quando o email foi aberto
   */
  async registerEmailOpen(token: string): Promise<void> {
    this.logger.log(`Tentativa de registrar abertura com token: ${token}`);

    try {
      // Buscar o log de notificação pelo token
      const logNotificacao = await this.logNotificacaoRepository.findOne({
        where: { tracking_token: token },
      });

      this.logger.log(
        `Resultado da busca: ${logNotificacao ? `ID ${logNotificacao.id}` : 'NÃO ENCONTRADO'}`,
      );

      if (!logNotificacao) {
        this.logger.warn(`Token de tracking não encontrado: ${token}`);

        // DEBUG: Listar alguns tokens do banco para comparar
        const tokens = await this.logNotificacaoRepository.find({
          select: ['id', 'tracking_token'],
          take: 5,
          order: { id: 'DESC' },
        });
        this.logger.log(`Últimos tokens no banco:`, tokens);
        return;
      }

      // Se já foi marcado como lido, não atualizar novamente
      if (logNotificacao.lido) {
        this.logger.log(
          `Email já foi marcado como lido anteriormente. Log ID: ${logNotificacao.id}`,
        );
        return;
      }

      // Marcar como lido e registrar data de leitura
      await this.logNotificacaoRepository.update(logNotificacao.id, {
        lido: true,
        data_leitura: new Date(),
      });

      this.logger.log(
        `✅ Email marcado como lido com sucesso! Log ID: ${logNotificacao.id}, Token: ${token}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar abertura do email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Busca estatísticas de abertura de emails
   */
  async getEmailOpenStats(): Promise<{
    totalEnviados: number;
    totalLidos: number;
    percentualAbertura: number;
  }> {
    try {
      const totalEnviados = await this.logNotificacaoRepository.count({
        where: { email_enviado: true },
      });

      const totalLidos = await this.logNotificacaoRepository.count({
        where: {
          email_enviado: true,
          lido: true,
        },
      });

      const percentualAbertura =
        totalEnviados > 0 ? (totalLidos / totalEnviados) * 100 : 0;

      return {
        totalEnviados,
        totalLidos,
        percentualAbertura: Math.round(percentualAbertura * 100) / 100,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar estatísticas de abertura: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Busca logs com detalhes de rastreamento
   */
  async getTrackingDetails(limit: number = 50): Promise<any[]> {
    try {
      return await this.logNotificacaoRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.devedor', 'devedor')
        .select([
          'log.id',
          'log.email_enviado',
          'log.data_envio',
          'log.lido',
          'log.data_leitura',
          'log.tracking_token',
          'devedor.nome',
          'devedor.email',
        ])
        .where('log.email_enviado = :enviado', { enviado: true })
        .orderBy('log.data_envio', 'DESC')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error(
        `Erro ao buscar detalhes de tracking: ${error.message}`,
      );
      throw error;
    }
  }
}
