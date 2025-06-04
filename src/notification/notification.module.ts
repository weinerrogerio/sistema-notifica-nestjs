import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { LogNotificacaoModule } from '@app/log-notificacao/log-notificacao.module';
import { DocProtestoModule } from '@app/doc-protesto/doc-protesto.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { TrackingPixelModule } from '@app/tracking/tracking.module';

@Module({
  imports: [
    TrackingPixelModule,
    LogNotificacaoModule,
    DocProtestoModule,
    TypeOrmModule.forFeature([LogNotificacao]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
