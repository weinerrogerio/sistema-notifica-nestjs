import { Module } from '@nestjs/common';
import { LogNotificacaoService } from './log-notificacao.service';
import { LogNotificacaoController } from './log-notificacao.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogNotificacao } from './entities/log-notificacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogNotificacao])],
  controllers: [LogNotificacaoController],
  providers: [LogNotificacaoService],
  exports: [LogNotificacaoService],
})
export class LogNotificacaoModule {}
