import { Module } from '@nestjs/common';
import { LogArquivoImportService } from './log-arquivo-import.service';
import { LogArquivoImportController } from './log-arquivo-import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogImportacaoArquivo } from './entities/log-arquivo-import.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogImportacaoArquivo])],
  controllers: [LogArquivoImportController],
  providers: [LogArquivoImportService],
  exports: [LogArquivoImportService],
})
export class LogArquivoImportModule {}
