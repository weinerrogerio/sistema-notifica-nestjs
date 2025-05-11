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

  async importOriginal(buffer: Buffer): Promise<void> {
    const xml = buffer.toString('utf-8');
    console.log(xml);

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
  }

  // ss:index --> indica o index do cabeçalho ou seja a coluna a qual o dado pertence!!!!!
  ///* FAZER STRING DE OBJETOS
  // OBJETO DEVE TER A MESMA QUANTIDADE DE COLUNAS (JA OBTIDAS EM HEADER - Extrair Cabeçalhos)
  // INJETAR OSDADOSNESSE ARRAY - SE A CELL TIVER SS.index PULAR OS CAMPOS TEA CHEGAR NESSE INDEX
  // POR EX: SRRAY TEM 5 CAMPOS VAZIOS 0,1 JA FOI PREENCHIDO,
  // (AGORA APONTAMOS PRO 2 DO ARRAY) SE SS.index = 3 PULAR 2 E PREENCHER 3 E SEGUIR A SEQUENCIA
  // E REPETIR LOGICA ATE A ULTIMA COLUNA E PODER PREENCHER TODOS OS CAMPOS DO ARRAY*/

  async import(buffer: Buffer): Promise<Record<string, string>[]> {
    const xml = buffer.toString('utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      parseAttributeValue: true,
    });

    const jsonObj = parser.parse(xml);
    const rows = jsonObj.Workbook?.Worksheet?.Table?.Row ?? [];

    function normalizeKey(str: string): string {
      return removeAcentos(str)
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '_');
    }

    // 1. Extrair Cabeçalhos
    const headerCells = Array.isArray(rows[0]?.Cell) ? rows[0].Cell : [];
    const headerMap: Record<number, string> = {};

    headerCells.forEach((cell, idx) => {
      // Usa 'ss:Index' se disponível, caso contrário usa o índice atual + 1
      const cellIndex = cell['ss:Index'] ? cell['ss:Index'] - 1 : idx;

      // Extrai o valor do cabeçalho
      let headerValue;
      if (typeof cell.Data === 'object' && cell.Data['#text']) {
        headerValue = cell.Data['#text'].trim();
      } else if (cell.Data) {
        headerValue = cell.Data.toString().trim();
      } else {
        headerValue = `coluna_${cellIndex + 1}`;
      }

      // Normaliza o nome do cabeçalho
      headerMap[cellIndex] = normalizeKey(headerValue);
    });

    // 2. Processar linhas de dados
    const dados: Record<string, string>[] = rows
      .slice(1)
      .filter((row) => Array.isArray(row?.Cell))
      .map((row) => {
        const rowData: Record<string, string> = {};
        const cells = Array.isArray(row.Cell) ? row.Cell : [];

        // Inicializa todos os campos com string vazia
        Object.values(headerMap).forEach((header) => {
          rowData[header] = '';
        });

        let currentIndex = 0;

        cells.forEach((cell) => {
          // Se tem 'ss:Index', use-o para posicionar corretamente
          if (cell['ss:Index']) {
            currentIndex = cell['ss:Index'] - 1;
          }

          // Extrai o valor da célula
          let cellValue = '';
          if (
            typeof cell.Data === 'object' &&
            cell.Data['#text'] !== undefined
          ) {
            cellValue = cell.Data['#text']?.toString().trim() || '';
          } else if (cell.Data !== undefined) {
            cellValue = cell.Data?.toString().trim() || '';
          }

          // Pega o cabeçalho correspondente a este índice
          const header = headerMap[currentIndex];
          if (header) {
            rowData[header] = cellValue;
          }

          // Avança para a próxima coluna
          currentIndex++;
        });

        return rowData;
      });

    return dados;
  }
}
