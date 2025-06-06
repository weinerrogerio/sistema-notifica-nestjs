import { Injectable, Logger } from '@nestjs/common';
import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';
import { NotificationQueryService } from './services/notification-search.service';
import { EmailService } from './services/notification-email.service';
import { NotificationOrchestratorService } from './services/notification-log.service';
import { NotificationResult } from './interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private notificationQueryService: NotificationQueryService,
    private emailService: EmailService,
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  // ------------------------------------- Métodos de busca ------------------------------------- //

  async buscarNotificacoesPendentes(): Promise<IntimacaoData[]> {
    return this.notificationQueryService.buscarNotificacoesPendentes();
  }

  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    return this.notificationQueryService.buscarIntimacoesPorDevedorENumProtesto(
      devedorNome,
      numDistribuicaoProtesto,
    );
  }

  async buscarNotificacoesPendentesPorDevedor(
    devedorId: number,
  ): Promise<IntimacaoData[]> {
    return this.notificationQueryService.buscarNotificacoesPendentesPorDevedor(
      devedorId,
    );
  }

  async buscarNotificacoesPendentesPorDistribuicao(
    numDistribuicao: string,
  ): Promise<IntimacaoData[]> {
    return this.notificationQueryService.buscarNotificacoesPendentesPorDistribuicao(
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
    return this.notificationQueryService.buscarNotificacoesComPaginacao(
      page,
      limit,
      filtros,
    );
  }

  async marcarComoEnviada(logNotificacaoId: number): Promise<void> {
    return this.notificationQueryService.marcarComoEnviada(logNotificacaoId);
  }

  async marcarMultiplasComoEnviadas(
    logNotificacaoIds: number[],
  ): Promise<void> {
    return this.notificationQueryService.marcarMultiplasComoEnviadas(
      logNotificacaoIds,
    );
  }

  // ------------------------------------- Métodos de envio ------------------------------------- //

  async sendNotificationsWithTracking(): Promise<NotificationResult> {
    return this.orchestratorService.sendNotificationsWithTracking();
  }

  async sendOneNotificationWithTracking(
    dados: IntimacaoData,
  ): Promise<boolean> {
    return this.orchestratorService.sendOneNotificationWithTracking(dados);
  }

  async sendNotification(dados: IntimacaoData): Promise<boolean> {
    return this.orchestratorService.sendSimpleNotification(dados);
  }

  async sendNotifications(dados: IntimacaoData[]): Promise<void> {
    return this.orchestratorService.sendBulkNotifications(dados);
  }
}
