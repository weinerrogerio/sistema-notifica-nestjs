import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { TrackingService } from '@app/tracking/tracking.service';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { SendNotification } from './dto/send-notification.dto';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly trackingService: TrackingService,
  ) {}

  // Envia várias notificações COM tracking ---- CUIDADO - CONSERTAR - PRECISA DE MAIS VALIDAÇÃOES
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

  // ENVIA UMA INTIMAÇÃO com tracking (se tiver o logNotificacaoId)
  @Post('intimacao-tracking')
  @Roles(Role.USER, Role.ADMIN)
  async sendOneNotificationTeste(@Body() dados: SendNotification) {
    console.log('TESTES DADOS: ', dados);
    if (!dados.logNotificacaoId) {
      return {
        success: false,
        message: 'logNotificacaoId é obrigatório',
      };
    }
    const result =
      await this.notificationService.sendOneNotificationWithTracking(dados);

    if (result.success) {
      return {
        success: true,
        message: result.message || 'Notificação enviada com sucesso',
      };
    } else {
      return {
        success: false,
        message: result.message || 'Falha no envio',
      };
    }
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

  //envia varias notificacoes -- CUIDADO
  @Post('intimacoes')
  @Roles(Role.USER, Role.ADMIN)
  async sendMultipleNotifications() {
    return 'fazer rota depois';
  }
}
