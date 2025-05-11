import { ImportStrategy } from './import.strategy';
import { parse } from 'csv-parse/sync';
//import { remove as removeAcentos } from 'diacritics';

export class CsvImportStrategy implements ImportStrategy {
  canHandle(fileMimeType: string): boolean {
    return fileMimeType === 'text/csv';
  }

  async import(fileBuffer: Buffer): Promise<Record<string, string>[]> {
    const csvString = fileBuffer.toString('utf-8');
    console.log(`Importando arquivo CSV com ${fileBuffer.byteLength} bytes`);

    try {
      const records: Record<string, string>[] = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      return records;
    } catch (error) {
      console.error('Erro ao processar o arquivo CSV:', error);
      throw error;
    }
  }
}
