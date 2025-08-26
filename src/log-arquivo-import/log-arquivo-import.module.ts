import { Module } from '@nestjs/common';
import { LogArquivoImportService } from './log-arquivo-import.service';
import { LogArquivoImportController } from './log-arquivo-import.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogImportacaoArquivo } from './entities/log-arquivo-import.entity';
import { LogUsersModule } from '@app/log-user/log-users.module';
import { DocProtestoModule } from '@app/doc-protesto/doc-protesto.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogImportacaoArquivo]),
    LogUsersModule,
    DocProtestoModule,
  ],
  controllers: [LogArquivoImportController],
  providers: [LogArquivoImportService],
  exports: [LogArquivoImportService],
})
export class LogArquivoImportModule {}
