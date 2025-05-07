import { Module } from '@nestjs/common';
import { LogArquivoService } from './log-arquivo.service';
import { LogArquivoController } from './log-arquivo.controller';

@Module({
  controllers: [LogArquivoController],
  providers: [LogArquivoService],
})
export class LogArquivoModule {}
