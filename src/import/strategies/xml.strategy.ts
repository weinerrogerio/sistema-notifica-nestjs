import { Injectable } from '@nestjs/common';
import { ImportStrategy } from './import.strategy';
//import * as xml2js from 'xml2js';
import { XMLParser } from 'fast-xml-parser';
import { remove as removeAcentos } from 'diacritics';

@Injectable()
export class XmlImportStrategy implements ImportStrategy {
  canHandle(mimeType: string): boolean {
    return mimeType === 'application/xml' || mimeType === 'text/xml';
  }

  async import(buffer: Buffer): Promise<void> {
    /* const xml = buffer.toString('utf-8');
    const parsed = await xml2js.parseStringPromise(xml); */
    const xml = buffer.toString('utf-8');

    /* const parser = new XMLParser();
    try {
      const jsonObj = parser.parse(xml);
      //ATENÇÃO:verificar a existencia ta tabela
      const rows = jsonObj.Workbook?.Worksheet?.Table?.Row ?? [];
      //console.log('ROWS:::', rows);

      //console.log('ROW[1]:::', rows[1].Cell[0]);

      const dados = rows.slice(1).map((row) => row.Cell);

      console.log('DADOS:::::', dados);

      console.log(dados[0][2].Data);

      // Aqui você faria a lógica de salvar os dados no banco
    } catch (error) {
      console.log('ERRO AQUI');
      console.error('Erro ao processar XML:', error);
      throw error;
    } */

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
    });

    const jsonObj = parser.parse(xml);
    const rows = jsonObj.Workbook?.Worksheet?.Table?.Row ?? [];

    if (rows.length < 2) {
      console.warn('O XML não contém dados suficientes.');
      return;
    }

    function normalizeKey(str: string): string {
      return removeAcentos(str)
        .toLowerCase()
        .replace(/[^\w\s]/gi, '') // remove pontuação
        .replace(/\s+/g, '_'); // substitui espaços por underline
    }

    // Extrai cabeçalhos
    const headerCells = Array.isArray(rows[0]?.Cell) ? rows[0].Cell : [];
    const headers: string[] = [];

    let colIndex = 0;
    headerCells.forEach((cell) => {
      const index = cell.Index ? cell.Index - 1 : colIndex;
      const raw =
        typeof cell.Data === 'object' ? cell.Data['#text'] : cell.Data;
      const value = raw?.trim() ?? `coluna_${index + 1}`;
      headers[index] = normalizeKey(value);
      colIndex = index + 1;
    });

    // Extrai os dados
    const dados = rows
      .slice(1)
      .filter((row) => Array.isArray(row?.Cell)) // descarta apenas linhas *sem nenhuma célula*
      .map((row) => {
        const rowData: Record<string, string> = {};
        const cells = Array.isArray(row.Cell) ? row.Cell : [];

        let currentCol = 0;

        // percorre cada célula respeitando o ss:Index
        cells.forEach((cell) => {
          const index = cell.Index ? cell.Index - 1 : currentCol;
          const key = headers[index] ?? `coluna_${index + 1}`;

          let valor = '';
          if (cell?.Data) {
            valor =
              typeof cell.Data === 'object'
                ? (cell.Data['#text'] ?? '')
                : cell.Data;
          }

          rowData[key] = valor.toString().trim();
          currentCol = index + 1;
        });

        // preenche colunas ausentes com string vazia (garante alinhamento completo)
        headers.forEach((header) => {
          if (!(header in rowData)) {
            rowData[header] = '';
          }
        });

        return rowData;
      });

    console.log('Dados estruturados:', dados);
  }
}
