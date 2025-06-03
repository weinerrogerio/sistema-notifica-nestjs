import { Body, Controller, Get, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  //envia varias notificacoes
  @Post('intimacoes')
  async sendMultipleNotifications() {
    return 'fazer rota depois';
  }

  //ENVIA UMA INTIMAÇÃO
  @Post('intimacao')
  async sendNotification(@Body() dados: SendNotificationDto) {
    const success = await this.notificationService.sendNotification(dados);

    return {
      success,
      message: success
        ? 'Intimação enviada com sucesso!'
        : 'Falha ao enviar intimação',
    };
  }

  /* -------------------------------------   BUSCAS  -------------------------------------- */
  //BUSCA POR NOTIFICAÇÕES PENDENTES
  @Get('busca')
  async buscarNotificacoesPendentes() {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentes();

    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DEVEDOR
  @Get('busca/:devedorId')
  async buscarNotificacoesPendentesPorDevedor(@Body() devedorId: number) {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentesPorDevedor(
        devedorId,
      );

    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DISTRIBUIÇÃO
  @Get('busca/distribuicao/:numDistribuicao')
  async buscarNotificacoesPendentesPorDistribuicao(
    @Body() numDistribuicao: string,
  ) {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentesPorDistribuicao(
        numDistribuicao,
      );

    return intimacoes;
  }
}
