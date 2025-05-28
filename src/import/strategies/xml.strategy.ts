import { Injectable } from '@nestjs/common';
import { ImportStrategy } from './import.strategy';
import { XMLParser } from 'fast-xml-parser';
import { remove as removeAcentos } from 'diacritics';
import { DataValidation } from '@app/common/utils/xmlValidation.util';
import { TransformationResult } from '@app/common/utils/dataTransform';
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
  Workbook?: ExcelWorkbook;
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

  //ALERTA: FUNÇÃO IMPORT AINDA NAO CONSEGUE LER MUITOS DADOS DE UMA VEZ(1000+) --ARRUMAR ISSO
  async import(buffer: Buffer): Promise<Record<string, string>[]> {
    const xml = buffer.toString('utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
    });

    const jsonObj: ExcelWorkbook = parser.parse(xml);
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

    // 2. Função para extrair dados de uma célula
    const extractCellValue = (cell: ExcelCell): string => {
      if (
        typeof cell.Data === 'object' &&
        cell.Data !== null &&
        cell.Data['#text'] !== undefined
      ) {
        return cell.Data['#text']?.toString().trim() || '';
      } else if (cell.Data !== undefined && cell.Data !== null) {
        return cell.Data.toString().trim() || '';
      }
      return '';
    };

    // 3. Função para verificar se uma linha é uma linha principal (com dados do título)
    const isMainRow = (rowData: Record<string, string>): boolean => {
      // Campos que indicam que é uma linha principal do título
      const mainFields = [
        'apresentante',
        'codigo',
        'cartorio',
        'data',
        'protocolo',
      ];
      return mainFields.some(
        (field) => rowData[field] && rowData[field].trim() !== '',
      );
    };

    // 4. Função para verificar se uma linha tem dados de devedor
    const hasDebtorData = (rowData: Record<string, string>): boolean => {
      const debtorFields = ['devedor', 'documento'];
      return debtorFields.some(
        (field) => rowData[field] && rowData[field].trim() !== '',
      );
    };

    // 5. Processar linhas de dados
    const processedData: Record<string, string>[] = [];
    let lastMainRecord: Record<string, string> | null = null;

    const dataRows = rows.slice(1); // Ignora a linha de cabeçalho

    for (const row of dataRows) {
      if (!Array.isArray(row?.Cell) || row.Cell.length === 0) {
        continue;
      }

      // Criar objeto da linha atual
      const rowData: Record<string, string> = {};
      const cells: ExcelCell[] = Array.isArray(row.Cell) ? row.Cell : [];

      // Inicializar todos os campos como string vazia
      Object.values(headerMap).forEach((header) => {
        rowData[header] = '';
      });

      // Preencher dados das células considerando ss:Index
      let currentIndex = 0;
      cells.forEach((cell: ExcelCell) => {
        if (cell['ss:Index']) {
          currentIndex = cell['ss:Index'] - 1;
        }

        const cellValue = extractCellValue(cell);
        const header = headerMap[currentIndex];

        if (header) {
          rowData[header] = cellValue;
        }

        currentIndex++;
      });

      // Verificar se a linha tem dados significativos
      const hasAnyData = Object.values(rowData).some(
        (value) => value.trim() !== '',
      );
      if (!hasAnyData) {
        continue;
      }

      // Verificar se é uma linha principal ou secundária
      if (isMainRow(rowData)) {
        // É uma linha principal - salvar como último registro principal
        lastMainRecord = { ...rowData };
        processedData.push(rowData);
      } else if (hasDebtorData(rowData) && lastMainRecord) {
        // É uma linha secundária com dados de devedor - mesclar com o último registro principal
        const mergedRecord: Record<string, string> = { ...lastMainRecord };

        // Sobrescrever apenas os campos que têm dados na linha secundária
        Object.keys(rowData).forEach((key) => {
          if (rowData[key] && rowData[key].trim() !== '') {
            mergedRecord[key] = rowData[key];
          }
        });

        processedData.push(mergedRecord);
      }
      // Se não é linha principal nem tem dados de devedor, ignora a linha
    }

    return processedData;
  }

  // FUNÇÃO RECEBE OS DADOS DE IMPORT E ENVIA PARA AS VALIDAÇÕES, TRANSFORM E POR FIM PERSISTENCIA(xmlCreate())
  async processFile(
    fileBuffer: Buffer,
    tokenPayload: TokenPayloadDto,
  ): Promise<void> {
    const dadosImportados = await this.import(fileBuffer);
    //console.log('dadosImportados::::  ', dadosImportados);

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
