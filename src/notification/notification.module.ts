import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { LogNotificacaoModule } from '@app/log-notificacao/log-notificacao.module';
import { DocProtestoModule } from '@app/doc-protesto/doc-protesto.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
<<<<<<< HEAD
import { TrackingPixelModule } from '@app/tracking-pixel/tracking-pixel.module';
=======
import { TrackingPixelModule } from '@app/tracking/tracking.module';
>>>>>>> 6d33415a355ee5b1da811fe64db74d42e2312a74

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
