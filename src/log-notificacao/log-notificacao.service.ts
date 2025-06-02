import { Injectable } from '@nestjs/common';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';
import { LogNotificacao } from './entities/log-notificacao.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
//NOTA: ALTERARA ENTIDADE--> LOG_NOTIFICACAO -> ADICIONAR COLUNA DE EMAIL ENCONTRADO, COLUNAR DE ENVIADO, E DATA DE ENVIO != DATA GRAVAÇÃO
@Injectable()
export class LogNotificacaoService {
  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {}
  async create(createLogNotificacaoDto: CreateLogNotificacaoDto) {
    console.log('createLogNotificacaoDto recebido:', createLogNotificacaoDto);
    const newLogDto = {
      email_enviado: false,
      lido: false,
      fk_devedor: createLogNotificacaoDto?.fk_devedor,
      fk_protesto: createLogNotificacaoDto?.fk_protesto,
    };
    console.log('newLogDto antes de criar:', newLogDto);
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    console.log('newLog após create:', newLog);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }

  findAll() {
    return `This action returns all logNotificacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logNotificacao`;
  }

  // update  data de envio, email enviado
  async updateEnvioEmail(
    id: number,
    updateLogNotificacaoDto: UpdateLogNotificacaoDto,
  ) {
    const newLogDto = {
      email_enviado: updateLogNotificacaoDto?.email_enviado,
      data_envio: updateLogNotificacaoDto?.data_envio,
      ...updateLogNotificacaoDto,
    };
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }

  // update lido
  async updateReceived(
    id: number,
    updateLogNotificacaoDto: UpdateLogNotificacaoDto,
  ) {
    const newLogDto = {
      lido: updateLogNotificacaoDto?.lido,
      ...updateLogNotificacaoDto,
    };
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }
  async update(id: number, updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    return `This action updates a #${id} logNotificacao ${updateLogNotificacaoDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} logNotificacao`;
  }
}
