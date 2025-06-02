import { Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('cobranca')
  async enviarCobranca() {
    const success = await this.notificationService.enviarNotificacao();

    return {
      success,
      message: success
        ? 'Intimação enviada com sucesso!'
        : 'Falha ao enviar intimação',
    };
  }

  @Post('busca')
  async buscarIntimacoesPorDevedorENumProtesto() {
    const intimacoes =
      await this.notificationService.buscarIntimacoesPorDevedorENumProtesto(
        'DEVEDOR 13',
        '12345',
      );

    return intimacoes;
  }
}
