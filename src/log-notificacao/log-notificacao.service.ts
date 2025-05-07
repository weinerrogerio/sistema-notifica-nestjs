import { Injectable } from '@nestjs/common';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';

@Injectable()
export class LogNotificacaoService {
  create(createLogNotificacaoDto: CreateLogNotificacaoDto) {
    return 'This action adds a new logNotificacao';
  }

  findAll() {
    return `This action returns all logNotificacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logNotificacao`;
  }

  update(id: number, updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    return `This action updates a #${id} logNotificacao`;
  }

  remove(id: number) {
    return `This action removes a #${id} logNotificacao`;
  }
}
