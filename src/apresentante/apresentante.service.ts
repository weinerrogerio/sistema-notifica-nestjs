import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateApresentanteDto } from './dto/create-apresentante.dto';
import { UpdateApresentanteDto } from './dto/update-apresentante.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Apresentante } from './entities/apresentante.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ApresentanteService {
  constructor(
    @InjectRepository(Apresentante)
    private readonly apresentanteRepository: Repository<Apresentante>,
  ) {}
  async create(createApresentanteDto: CreateApresentanteDto) {
    try {
      const newApresentante = {
        nome: createApresentanteDto.nome,
        cod_apresentante: createApresentanteDto.cod_apresentante,
      };
      return await this.apresentanteRepository.save(newApresentante);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(
          `Apresentante informado ja esta cadastrado  ${error}`,
        );
      }
      /* throw error;
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('O código de tabelionato já está em uso');
      } */
      // Erro genérico para casos não previstos
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }
  async findOrCreate(createApresentanteDto: CreateApresentanteDto) {
    //verifica se existe
    const existingApresentante = await this.findOneByDoc(
      createApresentanteDto.cod_apresentante,
    );
    // se exite retorna o apresentante
    if (existingApresentante) {
      return existingApresentante;
    }
    // se nao existe cria um novo
    return this.create(createApresentanteDto);
  }

  async findOneByDoc(doc_apresentante: string) {
    const apresentante = await this.apresentanteRepository.findOne({
      where: { cod_apresentante: doc_apresentante },
    });
    return apresentante;
  }

  findAll() {
    return `This action returns all apresentante`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apresentante`;
  }

  update(id: number, updateApresentanteDto: UpdateApresentanteDto) {
    console.log(updateApresentanteDto);

    return `This action updates a #${id} apresentante`;
  }

  remove(id: number) {
    return `This action removes a #${id} apresentante`;
  }
}
