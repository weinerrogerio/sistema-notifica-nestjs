import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateCredorDto } from './dto/create-credor.dto';
import { UpdateCredorDto } from './dto/update-credor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Credor } from './entities/credor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CredorService {
  constructor(
    @InjectRepository(Credor)
    private credorRepository: Repository<Credor>,
  ) {}

  //ALERTA: ARRUMAR A CRIANÇÃO DE CREDOR --> SACADOR E CEDENTE NÃO É IGUAL A CREDOR!!!!!!!
  async create(createCredorDto: CreateCredorDto) {
    try {
      const newCredorDto = {
        cedente: createCredorDto.cedente,
        sacador: createCredorDto.sacador,
        doc_credor: createCredorDto.doc_credor,
      };
      const newCredor = await this.credorRepository.save(newCredorDto);
      return newCredor;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(error);
      }
      throw error;
    }
  }
  async findOrCreate(createCredorDto: CreateCredorDto) {
    try {
      const existingCredor = await this.findOneByDoc(
        createCredorDto.doc_credor,
      );
      if (existingCredor) {
        return existingCredor;
      }
      const newCredor = {
        cedente: createCredorDto.cedente,
        sacador: createCredorDto.sacador,
        doc_credor: createCredorDto.doc_credor,
      };
      await this.credorRepository.save(newCredor);
      return newCredor;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Devedor já cadastrado');
      }
      throw error;
    }
  }
  async findOneByDoc(doc_credor: string) {
    const credor = await this.credorRepository.findOne({
      where: { doc_credor: doc_credor },
    });
    return credor;
  }

  findAll() {
    return `This action returns all credor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} credor`;
  }

  update(id: number, updateCredorDto: UpdateCredorDto) {
    console.log(updateCredorDto);

    return `This action updates a #${id} credor`;
  }

  remove(id: number) {
    return `This action removes a #${id} credor`;
  }
}
