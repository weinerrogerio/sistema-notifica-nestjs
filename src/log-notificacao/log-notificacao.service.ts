import { Injectable } from '@nestjs/common';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';
import { LogNotificacao } from './entities/log-notificacao.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LogNotificacaoService {
  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {}
  async create(createLogNotificacaoDto: CreateLogNotificacaoDto) {
    const newLogDto = {
      email_enviado: createLogNotificacaoDto?.email_enviado,
      data_envio: createLogNotificacaoDto?.data_envio,
      lido: createLogNotificacaoDto?.lido,
      fk_id_devedor: createLogNotificacaoDto?.fk_id_devedor,
      fk_id_protest: createLogNotificacaoDto?.fk_id_protest,
    };
    // util para simplesmente salvar
    //return await this.logNotificacaoRepository.save(newLogDtos);

    //util para salvar e retornar (validar antes de salvar)
    const newDevedor = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newDevedor);
    return newDevedor;
  }

  findAll() {
    return `This action returns all logNotificacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logNotificacao`;
  }

  update(id: number, updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    console.log(updateLogNotificacaoDto);

    return `This action updates a #${id} logNotificacao`;
  }

  remove(id: number) {
    return `This action removes a #${id} logNotificacao`;
  }
}
