import { parse } from 'date-fns';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { DocProtestoService } from 'src/doc-protesto/doc-protesto.service';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES') private readonly strategies: ImportStrategy[],
    private readonly docProtestoService: DocProtestoService,
  ) {}

  create(createImportDto: CreateImportDto) {
    console.log(createImportDto);
    return 'This action adds a new import';
  }

  findAll() {
    return `This action returns all import`;
  }

  findOne(id: number) {
    return `This action returns a #${id} import`;
  }

  update(id: number, updateImportDto: UpdateImportDto) {
    console.log(updateImportDto);

    return `This action updates a #${id} import`;
  }

  remove(id: number) {
    return `This action removes a #${id} import`;
  }

  /* async importFile(file: Buffer, type: 'xml' | 'csv' | 'pdf') {
    const strategy = this.getStrategy(type); // retorna XmlImportStrategy, CsvImportStrategy, etc.
    const dados = await strategy.import(file); // retorna dados processados (JSON, por exemplo)

    // Aqui você decide para onde os dados vão
    for (const item of dados) {
      await this.docProtestoService.create(item); // ou docProtestoService, etc.
    }
  } */
  // essa função nao tem de estar necessáriamente fora de importFile()
  private parseDateBrToIso(dateStr: string): Date | null {
    if (!dateStr) return null;
    try {
      return parse(dateStr, 'dd/MM/yyyy', new Date());
    } catch {
      return null;
    }
  }
  async importFile(file: Express.Multer.File) {
    const strategy = this.strategies.find((s) => s.canHandle(file.mimetype));
    if (!strategy) {
      throw new BadRequestException(
        `Formato de arquivo não suportado. ${file.mimetype}`,
      );
    }
    const dados = await strategy.import(file.buffer);

    if (!Array.isArray(dados)) {
      throw new Error('O resultado da importação não é um array.');
    }

    try {
      for (const dado of dados) {
        console.log(dado); // ou console.log(JSON.stringify(dado))

        //FAZER A VALIDAÇÃO DOS DADOS ANTES DE GRAVAR !!!
        const newDocProtesto = {
          vencimento: this.parseDateBrToIso(dado.vencimento),
          data_apresentacao: this.parseDateBrToIso(dado.data_protocolo),
          num_distribuicao: dado.protocolo,
          data_distribuicao: this.parseDateBrToIso(dado.data_remessa),
          cart_protesto: dado.cartorio,
          num_titulo: dado.numero_do_titulo,
        };

        console.log(newDocProtesto);

        //await this.docProtestoService.create(newDocProtesto);
      }
    } catch (err) {
      console.error('Erro ao iterar pelos dados:', err);
      throw new Error('Falha ao processar os dados importados.');
    }
    return dados;
  }
}
