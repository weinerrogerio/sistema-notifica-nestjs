import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { CsvImportStrategy } from './strategies/csv.strategy';
import { XmlImportStrategy } from './strategies/xml.strategy';
import { ImportStrategy } from './strategies/import.strategy';
import { DocProtestoModule } from 'src/doc-protesto/doc-protesto.module';
import { DevedorModule } from '@app/devedor/devedor.module';
import { LogNotificacaoModule } from '@app/log-notificacao/log-notificacao.module';
import { CredorModule } from '@app/credor/credor.module';
import { ApresentanteModule } from '@app/apresentante/apresentante.module';
import { DocProtestoCredorModule } from '@app/doc-protesto_credor/doc-protesto_credor.module';
import { LogArquivoImportModule } from '@app/log-arquivo-import/log-arquivo-import.module';

@Module({
  controllers: [ImportController],
  //providers: [ImportService],
  providers: [
    ImportService,
    CsvImportStrategy,
    XmlImportStrategy,
    {
      provide: 'IMPORT_STRATEGIES',
      useFactory: (
        csv: CsvImportStrategy,
        xml: XmlImportStrategy,
      ): ImportStrategy[] => [csv, xml],
      inject: [CsvImportStrategy, XmlImportStrategy],
    },
  ],
  imports: [
    DocProtestoModule,
    DevedorModule,
    LogNotificacaoModule,
    CredorModule,
    ApresentanteModule,
    DocProtestoCredorModule,
    LogArquivoImportModule,
  ],
})
export class ImportModule {}
