import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDocProtestoCredorDto } from './dto/create-doc-protesto_credor.dto';
import { UpdateDocProtestoCredorDto } from './dto/update-doc-protesto_credor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocProtestoCredor } from './entities/doc-protesto-credor.entity';

@Injectable()
export class DocProtestoCredorService {
  constructor(
    @InjectRepository(DocProtestoCredor)
    private docProtestoCredorRepository: Repository<DocProtestoCredor>,
  ) {}

  async create(createDocProtestoCredorDto: CreateDocProtestoCredorDto) {
    try {
      const newDocProtestoCredorDto = {
        fk_protesto: createDocProtestoCredorDto.fk_protesto,
        fk_credor: createDocProtestoCredorDto.fk_credor,
      };
      const newDocProtestoCredor = this.docProtestoCredorRepository.create(
        newDocProtestoCredorDto,
      );
      return await this.docProtestoCredorRepository.save(newDocProtestoCredor);
    } catch (error) {
      throw new BadRequestException(
        'Erro ao relacionar n:n docProtesto e credor',
        error,
      );
    }
  }

  findAll() {
    return `This action returns all docProtestoCredor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} docProtestoCredor`;
  }

  update(id: number, updateDocProtestoCredorDto: UpdateDocProtestoCredorDto) {
    console.log(updateDocProtestoCredorDto);

    return `This action updates a #${id} docProtestoCredor`;
  }

  remove(id: number) {
    return `This action removes a #${id} docProtestoCredor`;
  }
}
