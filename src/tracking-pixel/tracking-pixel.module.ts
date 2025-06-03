import { Module } from '@nestjs/common';
import { TrackingService } from './tracking-pixel.service';
import { TrackingController } from './tracking-pixel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogNotificacao])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingPixelModule {}
