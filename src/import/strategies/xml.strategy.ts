import { Injectable } from '@nestjs/common';
import { ImportStrategy } from './import.strategy';
//import * as xml2js from 'xml2js';
import { XMLParser } from 'fast-xml-parser';
import { remove as removeAcentos } from 'diacritics';
import { DataValidation } from '@app/utilities/xmlValidation.util';
import { TransformationResult } from '@app/utilities/dataTransform';
import { ImportPersistenceService } from '../services/import-persistence.service';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';

// Definição das interfaces para a estrutura do XML
interface ExcelData {
  '#text'?: string;
}

interface ExcelCell {
  Data?: ExcelData | string | number | boolean;
  'ss:Index'?: number;
}

interface ExcelRow {
  Cell?: ExcelCell[];
  'ss:AutoFitHeight'?: number;
  'ss:Height'?: number;
  'ss:Span'?: number;
}

interface ExcelTable {
  Row?: ExcelRow[];
}

interface ExcelWorksheet {
  Table?: ExcelTable;
}

interface ExcelWorkbook {
  Workbook?: ExcelWorkbook; // A raiz do documento pode ter um wrapper <Workbook>
  Worksheet?: ExcelWorksheet;
}

@Injectable()
export class XmlImportStrategy implements ImportStrategy {
  constructor(
    private readonly dataValidation: DataValidation,
    private readonly transformationResult: TransformationResult,
    private readonly importPersistenceService: ImportPersistenceService,
  ) {}
  canHandle(mimeType: string): boolean {
    return mimeType === 'application/xml' || mimeType === 'text/xml';
  }

  async import(buffer: Buffer): Promise<Record<string, string>[]> {
    const xml = buffer.toString('utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
    });

    const jsonObj: ExcelWorkbook = parser.parse(xml);
    // Ajuste aqui se o seu XML tiver <Workbook> como raiz
    const rows: ExcelRow[] = jsonObj.Workbook?.Worksheet?.Table?.Row ?? [];

    function normalizeKey(str: string): string {
      return removeAcentos(str)
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_');
    }

    // 1. Extrair Cabeçalhos
    const headerRow = rows[0];
    const headerCells: ExcelCell[] = Array.isArray(headerRow?.Cell)
      ? headerRow.Cell
      : [];
    const headerMap: Record<number, string> = {};

    headerCells.forEach((cell, idx) => {
      const cellIndex = cell['ss:Index'] ? cell['ss:Index'] - 1 : idx;

      let headerValue: string | undefined;
      if (
        typeof cell.Data === 'object' &&
        cell.Data !== null &&
        cell.Data['#text'] !== undefined
      ) {
        headerValue = cell.Data['#text']?.trim();
      } else if (cell.Data !== undefined && cell.Data !== null) {
        headerValue = cell.Data.toString().trim();
      } else {
        headerValue = `coluna_${cellIndex + 1}`;
      }

      headerMap[cellIndex] = normalizeKey(
        headerValue || `coluna_${cellIndex + 1}`,
      );
    });

    // 2. Processar linhas de dados
    const dados: Record<string, string>[] = rows
      .slice(1) // Ignora a linha de cabeçalho
      .filter((row: ExcelRow) => {
        // Tipagem explícita aqui
        if (!Array.isArray(row?.Cell) || row.Cell.length === 0) {
          return false;
        }
        const hasMeaningfulData = row.Cell.some((cell: ExcelCell) => {
          // Tipagem explícita aqui
          let cellValue = '';
          if (
            typeof cell.Data === 'object' &&
            cell.Data !== null &&
            cell.Data['#text'] !== undefined
          ) {
            cellValue = cell.Data['#text']?.toString().trim() || '';
          } else if (cell.Data !== undefined && cell.Data !== null) {
            cellValue = cell.Data.toString().trim() || '';
          }
          return cellValue !== '';
        });
        return hasMeaningfulData;
      })
      .map((row: ExcelRow) => {
        // Tipagem explícita aqui
        const rowData: Record<string, string> = {};
        const cells: ExcelCell[] = Array.isArray(row.Cell) ? row.Cell : []; // Tipagem explícita aqui

        Object.values(headerMap).forEach((header) => {
          rowData[header] = '';
        });

        let currentIndex = 0;

        cells.forEach((cell: ExcelCell) => {
          // Tipagem explícita aqui
          if (cell['ss:Index']) {
            currentIndex = cell['ss:Index'] - 1;
          }

          let cellValue = '';
          if (
            typeof cell.Data === 'object' &&
            cell.Data !== null &&
            cell.Data['#text'] !== undefined
          ) {
            cellValue = cell.Data['#text']?.toString().trim() || '';
          } else if (cell.Data !== undefined && cell.Data !== null) {
            cellValue = cell.Data.toString().trim() || '';
          }

          const header = headerMap[currentIndex];
          if (header) {
            rowData[header] = cellValue;
          }

          currentIndex++;
        });

        return rowData;
      });

    return dados;
  }

  // FUNÇÃO RECEBE OS DADOS DE IMPORT E ENVIA PARA AS VALIDAÇÕES, TRANSFORM E POR FIM PERSISTENCIA(xmlCreate())
  async processFile(
    fileBuffer: Buffer,
    tokenPayload: TokenPayloadDto,
  ): Promise<void> {
    const dadosImportados = await this.import(fileBuffer);

    // lógica de processamento específica para CSV

    // Validação dos dados (a validação aceita Record<string, string>[])
    // melhorar a validação --> esta perdendo retorno(erros) atualmente
    const validationResult =
      await this.dataValidation.validate(dadosImportados);

    if (!validationResult.isValid) {
      const dataTransform =
        await this.transformationResult.tranformCsvData(dadosImportados);

      await this.importPersistenceService.xmlCreate(
        dataTransform,
        tokenPayload,
      );
    }

    // se os dados nao são validos e podem ser formatados (como data, mascaras de documento e valores...)
    // então passa por um formatador dependendo da estrategia,
    // nesse caso o dataTransform. Algo como:
    // se não prossegue para a persistência...
    // Se chegou até aqui, os dados são válidos
    // Proceder com a persistência
  }
}
