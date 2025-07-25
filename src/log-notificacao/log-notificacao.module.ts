import { Module } from '@nestjs/common';
import { LogNotificacaoService } from './log-notificacao.service';
import { LogNotificacaoController } from './log-notificacao.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from './entities/log-notificacao.entity';
import { LogNotificationQueryService } from './services/log-notification-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogNotificacao])],
  controllers: [LogNotificacaoController],
  providers: [LogNotificacaoService, LogNotificationQueryService],
  exports: [LogNotificacaoService, LogNotificationQueryService],
})
export class LogNotificacaoModule {}
