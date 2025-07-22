import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { TrackingPixelModule } from '@app/tracking/tracking.module';

import { NotificationService } from './notification.service';
import { EmailService } from './services/notification-email.service';
import { NotificationOrchestratorService } from './services/notification-log.service';
import { NotificationController } from './notification.controller';
import { LogNotificacaoModule } from '@app/log-notificacao/log-notificacao.module';
import { TemplateModule } from '@app/template/template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogNotificacao]),
    ConfigModule,
    TrackingPixelModule,
    LogNotificacaoModule,
    TemplateModule,
  ],
  controllers: [NotificationController],
  providers: [
    EmailService,
    NotificationOrchestratorService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
