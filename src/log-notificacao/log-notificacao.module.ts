import { Module } from '@nestjs/common';
import { LogNotificacaoService } from './log-notificacao.service';
import { LogNotificacaoController } from './log-notificacao.controller';

@Module({
  controllers: [LogNotificacaoController],
  providers: [LogNotificacaoService],
})
export class LogNotificacaoModule {}
