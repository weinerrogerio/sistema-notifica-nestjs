import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async enviarNotificacao(dados: any) {
    return true;
  }
}
