import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { TrackingService } from '@app/tracking/tracking.service';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly trackingService: TrackingService,
  ) {}

  // Envia várias notificações COM tracking (versão otimizada)
  @Post('intimacoes-tracking')
  @Roles(Role.USER, Role.ADMIN)
  async sendMultipleNotificationsWithTracking() {
    const resultado =
      await this.notificationService.sendNotificationsWithTracking();

    return {
      success: resultado.enviados > 0,
      message: `${resultado.enviados} intimações enviadas, ${resultado.erros} erros`,
      ...resultado,
    };
  }

  // ENVIA UMA INTIMAÇÃO com tracking (se você tiver o logNotificacaoId)
  @Post('intimacao-tracking')
  @Roles(Role.USER, Role.ADMIN)
  async sendNotificationWithTracking(@Body() dados: SendNotificationDto) {
    // dados deve incluir logNotificacaoId
    const intimacaoData = dados;

    if (!intimacaoData.logNotificacaoId) {
      return {
        success: false,
        message: 'logNotificacaoId é obrigatório',
      };
    }

    const success =
      await this.notificationService.sendOneNotificationWithTracking(
        intimacaoData,
      );

    return {
      success,
      message: success ? 'Intimação enviada com tracking!' : 'Falha no envio',
    };
  }

  // Buscar notificações pendentes (com IDs para tracking)
  @Get('pendentes-com-id')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesComId() {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentes();
    return {
      success: true,
      total: intimacoes.length,
      data: intimacoes,
    };
  }

  // Estatísticas de abertura
  @Get('stats')
  @Roles(Role.USER, Role.ADMIN)
  async getStats() {
    const stats = await this.trackingService.getEmailOpenStats();
    return {
      success: true,
      data: stats,
    };
  }

  // Detalhes de tracking
  @Get('tracking')
  @Roles(Role.USER, Role.ADMIN)
  async getTracking(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 50;
    const detalhes = await this.trackingService.getTrackingDetails(limitNum);

    return {
      success: true,
      total: detalhes.length,
      data: detalhes,
    };
  }

  //envia varias notificacoes
  @Post('intimacoes')
  @Roles(Role.USER, Role.ADMIN)
  async sendMultipleNotifications() {
    return 'fazer rota depois';
  }

  //ENVIA UMA INTIMAÇÃO
  @Post('intimacao')
  @Roles(Role.USER, Role.ADMIN)
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
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentes() {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentes();

    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DEVEDOR
  @Get('busca/:devedorId')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesPorDevedor(@Body() devedorId: number) {
    const intimacoes =
      await this.notificationService.buscarNotificacoesPendentesPorDevedor(
        devedorId,
      );

    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DISTRIBUIÇÃO
  @Get('busca/distribuicao/:numDistribuicao')
  @Roles(Role.USER, Role.ADMIN)
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
