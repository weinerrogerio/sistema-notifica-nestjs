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

  async findOrCreate(createDevedorDto: CreateDevedorDto) {
    try {
      // Primeiro, tenta encontrar o devedor pelo documento
      const existingDevedor = await this.findOneByDoc(
        createDevedorDto.doc_devedor,
      );
      // Se o devedor já existe, retorna ele
      if (existingDevedor) {
        return existingDevedor;
      }
      // Se não existe, cria um novo
      const newDevedorDto = {
        nome: createDevedorDto?.nome,
        doc_devedor: createDevedorDto?.doc_devedor,
        devedor_pj: createDevedorDto?.devedor_pj,
      };
      const newDevedor = this.create(newDevedorDto);
      return newDevedor;
    } catch (error) {
      // Ainda mantemos o tratamento de erro para caso ocorra outro tipo de erro
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Devedor já cadastrado');
      }
      throw error;
    }
  }

  async findOneByDoc(doc_devedor: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { doc_devedor: doc_devedor },
    });
    return devedor;
  }

  async findOneBrEmail(email: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { email: email },
    });
    return devedor;
  }

  async findOne(id: number) {
    const devedor = await this.devedorRepository.findOne({ where: { id: id } });
    if (!devedor || !devedor.id) throw new Error('Usuário não encontrado');
    return devedor;
  }

  findAll() {
    return `This action returns all devedor`;
  }
  update(id: number, updateDevedorDto: UpdateDevedorDto) {
    console.log(updateDevedorDto);

    return `This action updates a #${id} devedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} devedor`;
  }
}
