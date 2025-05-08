import { Injectable } from '@nestjs/common';
import { ImportStrategy } from './import.strategy';
//import * as xml2js from 'xml2js';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class XmlImportStrategy implements ImportStrategy {
  canHandle(mimeType: string): boolean {
    return mimeType === 'application/xml' || mimeType === 'text/xml';
  }

  async import(buffer: Buffer): Promise<void> {
    /* const xml = buffer.toString('utf-8');
    const parsed = await xml2js.parseStringPromise(xml); */
    const xml = buffer.toString('utf-8');
    console.log(xml);

    const parser = new XMLParser();
    try {
      const jsonObj = parser.parse(xml);
      console.log('Arquivo convertido com sucesso:', jsonObj);
      console.log(jsonObj.Workbook?.Worksheet?.Table?.Row);
      //console.log(jsonObj.Workbook?.Worksheet?.Table?.Row[0].Cell[0]); // Nomes das colunas --> DESCOSIDERAR para salvar no banco
      console.log(jsonObj.Workbook?.Worksheet?.Table?.Row[1].Cell[0]);
      console.log(jsonObj.Workbook?.Worksheet?.Table?.Row[2].Cell[0]);

      //ATENÇÃO:verificar a existencia ta tabela
      /* return jsonObj.Workbook?.Worksheet?.Table?.row; */

      /* const rows = jsonObj.Workbook?.Worksheet?.Table?.Row ?? [];
      const dados = rows.slice(1).map((row) => {
        return {
          campo1: row.Cell[0]?.Data,
          campo2: row.Cell[1]?.Data,
          campo3: row.Cell[2]?.Data,
        };
      }); 

      console.log(dados);*/

      // Aqui você faria a lógica de salvar os dados no banco
    } catch (error) {
      console.log('ERRO AQUI');
      console.error('Erro ao processar XML:', error);
      throw error;
    }
    /*  const xmlString = fileBuffer.toString('utf-8');
    const parser = new XMLParser();
    const json = parser.parse(xmlString);
    console.log(json); */ //
  }
}
