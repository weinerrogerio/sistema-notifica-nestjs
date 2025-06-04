import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogNotificacao])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingPixelModule {}
