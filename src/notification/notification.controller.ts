import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('intimacao')
  async enviarCobranca(@Body() dados: SendNotificationDto) {
    const success = await this.notificationService.sendNotification(dados);

    return {
      success,
      message: success
        ? 'Intimação enviada com sucesso!'
        : 'Falha ao enviar intimação',
    };
  }

  @Get('busca')
  async buscarNotificacoesPendentes() {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentes();

    return intimacoes;
  }

  @Post('teste')
  async enviarTeste() {
    return true;
  }
}
