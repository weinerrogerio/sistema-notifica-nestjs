import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './services/notification-email.service';
import { NotificationOrchestratorService } from './services/notification-log.service';
import { SendNotification } from './dto/send-notification.dto';
import {
  NotificationResult,
  NotificationResultAll,
} from '@app/common/interfaces/notification-data.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailService: EmailService,
    private orchestratorService: NotificationOrchestratorService,
  ) {}

  // ------------------------------------- Métodos de envio ------------------------------------- //

  // envia varias intimações com tracking
  async sendNotificationsWithTracking(): Promise<NotificationResultAll> {
    return this.orchestratorService.sendNotificationsWithTracking();
  }

  // envia UMA intimação com tracking
  async sendOneNotificationWithTracking(
    dados: SendNotification,
  ): Promise<NotificationResult> {
    return this.orchestratorService.sendOneNotificationWithTracking(dados);
  }
}
