import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';
import { LogUsersService } from '@app/log-user/log-users.service';

@Injectable()
export class CleanupTask {
  constructor(
    private readonly authService: AuthService,
    private readonly logUsersService: LogUsersService,
  ) {}

  // Executa a cada hora para limpar sessões expiradas
  //@Cron(CronExpression.EVERY_HOUR)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredSessions(): Promise<void> {
    try {
      const result = await this.logUsersService.cleanExpiredSessions();
      /*  console.log(
        `Limpeza de sessões expiradas: ${result.sessionsRevoked} sessões removidas`,
      ); */
      console.log(`Limpeza de sessões expiradas: ${result} sessões removidas`);
    } catch (error) {
      console.error('Erro na limpeza de sessões expiradas:', error);
    }
  }
}
