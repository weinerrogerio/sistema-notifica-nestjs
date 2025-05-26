import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES')
    private readonly strategies: ImportStrategy[],
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

  async importFile(file: Express.Multer.File, tokenPayload: TokenPayloadDto) {
    console.log('tokenPayload: ', tokenPayload);

    //Escolha da estrategia
    const strategy = this.strategies.find((s) => s.canHandle(file.mimetype));
    if (!strategy) {
      throw new BadRequestException(
        `Formato de arquivo não suportado. ${file.mimetype}`,
      );
    }
    //chamando a função import para tratamento + persistência
    await strategy.processFile(file.buffer, tokenPayload);

    //importando o arquivo
    //const dados = await strategy.import(file.buffer);
    // Importando o arquivo - mantém como Record<string, string>[]
    /* const dadosImportados: Record<string, string>[] = await strategy.import(
      file.buffer,
    );
    console.log('dadosImportados::::  ', dadosImportados);

    // Validação dos dados (a validação aceita Record<string, string>[])
    const validationResult =
      await this.dataValidation.validate(dadosImportados);
    console.log('validationResult::: ', validationResult);
 */
    // se os dados nao são validos e podem ser formatados (como data, mascaras de documento e valores...)
    // então passa por um formatador dependendo da estrategia,
    // nesse caso o csvDataTransform. Algo como:
    //const dataFormated =
    //this.transformationResult.tranformCsvData(dadosImportados);
    //console.log('dataFormated: ', dataFormated);

    // se não prossegue para a persistência...

    // Se chegou até aqui, os dados são válidos
    // Proceder com a persistência
    // return await this.importPersistance.service.create(dados);
  }
}
