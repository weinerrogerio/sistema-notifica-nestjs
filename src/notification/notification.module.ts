import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { TrackingPixelModule } from '@app/tracking/tracking.module';

import { NotificationService } from './notification.service';
import { NotificationQueryService } from './services/notification-search.service';
import { EmailService } from './services/notification-email.service';
import { NotificationOrchestratorService } from './services/notification-log.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogNotificacao]),
    ConfigModule,
    TrackingPixelModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationQueryService,
    EmailService,
    NotificationOrchestratorService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
