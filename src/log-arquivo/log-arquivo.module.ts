import { Module } from '@nestjs/common';
import { LogArquivoService } from './log-arquivo.service';
import { LogArquivoController } from './log-arquivo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogImportacaoArquivo } from './entities/log-arquivo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogImportacaoArquivo])],
  controllers: [LogArquivoController],
  providers: [LogArquivoService],
  exports: [LogArquivoService],
})
export class LogArquivoModule {}
