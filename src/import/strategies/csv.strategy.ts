import { ImportStrategy } from './import.strategy';

export class CsvImportStrategy implements ImportStrategy {
  canHandle(fileMimeType: string): boolean {
    return fileMimeType === 'text/csv';
  }

  async import(fileBuffer: Buffer): Promise<void> {
    console.log(`Importando arquivo CSV com ${fileBuffer.byteLength} bytes`);
    // lógica para importar CSV
    // parsear, validar e salvar no banco
  }
}
