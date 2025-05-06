import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { CsvImportStrategy } from './strategies/csv.strategy';
import { XmlImportStrategy } from './strategies/xml.strategy';
import { ImportStrategy } from './strategies/import.strategy';

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
})
export class ImportModule {}
