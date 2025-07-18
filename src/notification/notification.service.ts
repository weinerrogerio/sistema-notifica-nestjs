import { Injectable, Logger } from '@nestjs/common';
import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';
import { EmailService } from './services/notification-email.service';
import { NotificationOrchestratorService } from './services/notification-log.service';
import { NotificationResult } from './interfaces/notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailService: EmailService,
    private orchestratorService: NotificationOrchestratorService,
  ) {}

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
