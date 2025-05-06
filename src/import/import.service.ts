import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES') private readonly strategies: ImportStrategy[],
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

  async importFile(file: Express.Multer.File) {
    const strategy = this.strategies.find((s) => s.canHandle(file.mimetype));
    if (!strategy) {
      throw new BadRequestException(
        `Formato de arquivo não suportado. ${file.mimetype}`,
      );
    }
    return strategy.import(file.buffer);
  }
}
