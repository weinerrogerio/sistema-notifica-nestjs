import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('cobranca')
  async enviarCobranca(@Body() dados: SendCobrancaDto) {
    const success = await this.notificationService.enviarNotificacao(dados);

    return {
      success,
      message: success
        ? 'Cobrança enviada com sucesso!'
        : 'Falha ao enviar cobrança',
    };
  }
}
