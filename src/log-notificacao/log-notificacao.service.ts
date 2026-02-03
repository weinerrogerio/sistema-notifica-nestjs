import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';
import {
  LogNotificacao,
  NotificacaoStatus,
} from './entities/log-notificacao.entity';
import { LogNotificationQueryService } from './services/log-notification-search.service';
import {
  IntimacaoData,
  IntimacaoDataCompleto,
} from '@app/common/interfaces/notification-data.interface';

export interface AtualizacaoWebhook {
  status: NotificacaoStatus;
  eventoOriginal: string; // O nome do evento do Brevo (ex: 'hard_bounce')
  dataEvento: Date;
  motivo?: string; // Para erros
}

@Injectable()
export class LogNotificacaoService {
  private readonly logger = new Logger(LogNotificacaoService.name);

  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
    private readonly logNotificationQueryService: LogNotificationQueryService,
  ) {}

  async create(createLogNotificacaoDto: CreateLogNotificacaoDto) {
    this.logger.log('Criando novo log de notificação');

    const newLogDto = {
      email_enviado: false,
      lido: false,
      status: NotificacaoStatus.PENDENTE,
      fk_devedor: createLogNotificacaoDto?.fk_devedor,
      fk_protesto: createLogNotificacaoDto?.fk_protesto,
    };

    const newLog = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newLog);

    this.logger.log(`Log de notificação criado com ID: ${newLog.id}`);
    return newLog;
  }

  findAll() {
    return this.logNotificacaoRepository.find({
      relations: ['devedor', 'protesto'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.logNotificacaoRepository.findOne({
      where: { id },
      relations: ['devedor', 'protesto'],
    });
  }

  async update(id: number, updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    await this.logNotificacaoRepository.update(id, updateLogNotificacaoDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.logNotificacaoRepository.delete(id);
    return { deleted: true, id };
  }

  // ===================================================================================================
  // MÉTODOS DE ATUALIZAÇÃO DE STATUS COM ENUM
  // ===================================================================================================

  /**
   * Marca notificação como enviada
   */
  async marcarComoEnviada(
    logNotificacaoId: number,
    templateId?: number,
    // messageId removido da assinatura pois não salvamos no banco, ou usamos apenas para log
  ): Promise<void> {
    this.logger.log(`Marcando notificação ${logNotificacaoId} como enviada`);

    await this.logNotificacaoRepository.update(logNotificacaoId, {
      email_enviado: true,
      status: NotificacaoStatus.ENVIADO,
      fk_template: templateId | 1,
      data_envio: new Date(),
    });
  }

  /**
   * Atualiza status baseado no Webhook
   * Lógica simplificada: Atualiza status e datas pertinentes.
   */
  async atualizarStatusPorEvento(
    logNotificacaoId: number,
    dados: AtualizacaoWebhook,
  ): Promise<void> {
    this.logger.log(
      `Atualizando notificação ${logNotificacaoId}: Evento ${dados.eventoOriginal} -> Status ${dados.status}`,
    );

    const updateData: Partial<LogNotificacao> = {
      status: dados.status,
    };

    // Atualiza colunas específicas baseado no status final
    switch (dados.status) {
      case NotificacaoStatus.ENTREGUE:
        updateData.data_entrega = dados.dataEvento;
        break;

      case NotificacaoStatus.LIDO:
        // Se já foi lido uma vez, mantemos a primeira data ou atualizamos a última?
        // Geralmente 'data_leitura' é a primeira leitura.
        updateData.data_leitura = dados.dataEvento;
        break;

      case NotificacaoStatus.BOUNCE:
      case NotificacaoStatus.FALHA:
        // Salva o motivo técnico no campo mensagem_erro
        updateData.mensagem_erro =
          dados.motivo || `Erro evento: ${dados.eventoOriginal}`;
        break;
    }
    await this.logNotificacaoRepository.update(logNotificacaoId, updateData);
  }

  // ===================================================================================================
  // MÉTODOS DE BUSCA (delegados para LogNotificationQueryService)
  // ===================================================================================================

  async buscarNotificacoesPendentesAllData(): Promise<IntimacaoDataCompleto[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesAllData();
  }

  async buscarNotificacaoPendenteAllDataById(
    id: number,
  ): Promise<IntimacaoDataCompleto[]> {
    return this.logNotificationQueryService.buscarNotificacaoPendenteAllDataById(
      id,
    );
  }

  async buscarNotificacoesPendentesAll(): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesAll();
  }

  async buscarNotificacoesSimples() {
    return await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .where('devedor.email IS NOT NULL')
      .andWhere('devedor.email != :emptyEmail', { emptyEmail: '' })
      .getMany();
  }

  async buscarNotificacoesPendentesNaoEnviadas(): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesNaoEnviadas();
  }

  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarIntimacoesPorDevedorENumProtesto(
      devedorNome,
      numDistribuicaoProtesto,
    );
  }

  async buscarNotificacoesPendentesPorDevedor(
    devedorId: number,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesPorDevedor(
      devedorId,
    );
  }

  async buscarNotificacoesPendentesPorDistribuicao(
    numDistribuicao: string,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesPorDistribuicao(
      numDistribuicao,
    );
  }

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
    return this.logNotificationQueryService.buscarNotificacoesComPaginacao(
      page,
      limit,
      filtros,
    );
  }

  // ===================================================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ===================================================================================================

  /**
   * Busca taxa de abertura geral
   */
  async buscarTaxaDeAbertura(): Promise<{
    total: number;
    enviados: number;
    abertosELidos: number;
    taxaAbertura: number;
  }> {
    const total = await this.logNotificacaoRepository.count();
    const enviados = await this.logNotificacaoRepository.count({
      where: { email_enviado: true },
    });
    const abertosELidos = await this.logNotificacaoRepository.count({
      where: { status: NotificacaoStatus.LIDO, email_enviado: true },
    });

    const taxaAbertura = enviados > 0 ? (abertosELidos / enviados) * 100 : 0;

    return {
      total,
      enviados,
      abertosELidos,
      taxaAbertura: parseFloat(taxaAbertura.toFixed(2)),
    };
  }
}
