// tracking/tracking.service.ts
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
   * Gera um token único para rastreamento
   */
  generateTrackingToken(logNotificacaoId: number): string {
    const timestamp = Date.now().toString();
    const data = `${logNotificacaoId}-${timestamp}`;

    // Criar hash seguro do ID + timestamp
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 32); // Usar apenas os primeiros 32 caracteres
  }

  /**
   * Armazena o token de tracking no banco
   */
  async storeTrackingToken(
    logNotificacaoId: number,
    token: string,
  ): Promise<void> {
    try {
      await this.logNotificacaoRepository.update(logNotificacaoId, {
        tracking_token: token,
      });

      this.logger.log(
        `Token de tracking armazenado para log ID: ${logNotificacaoId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao armazenar token de tracking: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Registra quando o email foi aberto
   */
  async registerEmailOpen(token: string): Promise<void> {
    try {
      // Buscar o log de notificação pelo token
      const logNotificacao = await this.logNotificacaoRepository.findOne({
        where: { tracking_token: token },
      });

      if (!logNotificacao) {
        this.logger.warn(`Token de tracking não encontrado: ${token}`);
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
        `Email marcado como lido. Log ID: ${logNotificacao.id}, Token: ${token}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar abertura do email: ${error.message}`,
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
