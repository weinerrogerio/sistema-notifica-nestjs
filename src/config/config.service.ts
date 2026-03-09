import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from './entities/config.entity';

@Injectable()
export class PersonalConfigService {
  constructor(
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
  ) {}

  async create(createConfigDto: CreateConfigDto) {
    try {
      const newDataConfig = {
        id: 1,
        ...createConfigDto,
      };
      return await this.configRepository.save(newDataConfig);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException(
          'Config ja cadastrado - dados ja existem',
        );
      }
      throw new InternalServerErrorException(
        'Erro interno do servidor - Erro ao salvar Config',
      );
    }
  }

  async findAll() {
    return await this.configRepository.find();
  }

  async findOne(id: number) {
    return await this.configRepository.findOne({ where: { id: id } });
  }

  async update(updateConfigDto: UpdateConfigDto) {
    const data = await this.configRepository.findOneBy({ id: 1 });
    if (!data) {
      return this.create(updateConfigDto);
    }
    await this.configRepository.update(1, updateConfigDto);
    return this.findOne(1);
  }

  async remove(id: number) {
    await this.configRepository.delete(id);
    return { deleted: true, id };
  }
}
