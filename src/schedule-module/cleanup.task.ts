import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CleanupTask {
  constructor(private readonly authService: AuthService) {}

  // Executa a cada hora para limpar sessões expiradas
  //@Cron(CronExpression.EVERY_HOUR)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredSessions(): Promise<void> {
    try {
      const result = await this.authService.cleanExpiredSessions();
      console.log(
        `Limpeza de sessões expiradas: ${result.sessionsRevoked} sessões removidas`,
      );
    } catch (error) {
      console.error('Erro na limpeza de sessões expiradas:', error);
    }
  }
}
