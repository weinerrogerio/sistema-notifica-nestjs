import { IsNumber } from 'class-validator';

export class SendNotification {
  @IsNumber()
  logNotificacaoId: number;
}
