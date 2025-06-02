import { PartialType } from '@nestjs/mapped-types';
import { CreateLogNotificacaoDto } from './create-log-notificacao.dto';
import { IsBoolean, IsDate } from 'class-validator';

export class UpdateLogNotificacaoDto extends PartialType(
  CreateLogNotificacaoDto,
) {
  @IsBoolean()
  email_enviado?: boolean;

  @IsDate()
  data_envio?: Date;

  @IsBoolean()
  lido?: boolean;
}
