import { ConflictException, Injectable } from '@nestjs/common';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DevedorService {
  constructor(
    @InjectRepository(Devedor)
    private readonly devedorRepository: Repository<Devedor>,
  ) {}
  async create(createDevedorDto: CreateDevedorDto) {
    try {
      const newDevedorDto = {
        nome: createDevedorDto?.nome,
        doc_devedor: createDevedorDto?.doc_devedor,
        devedor_pj: createDevedorDto?.devedor_pj,
      };
      // util para simplesmente salvar
      //return await this.devedorRepository.save(newDevedorDto);

      //util para salvar e retornar (validar antes de salvar)
      const newDevedor = this.devedorRepository.create(newDevedorDto);
      await this.devedorRepository.save(newDevedor);
      return newDevedor;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Email ja cadastrado');
      }
      throw error;
    }
  }

  findAll() {
    return `This action returns all devedor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} devedor`;
  }

  update(id: number, updateDevedorDto: UpdateDevedorDto) {
    console.log(updateDevedorDto);

    return `This action updates a #${id} devedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} devedor`;
  }
}
