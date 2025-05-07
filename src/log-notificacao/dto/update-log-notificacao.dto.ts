import { PartialType } from '@nestjs/mapped-types';
import { CreateLogNotificacaoDto } from './create-log-notificacao.dto';

export class UpdateLogNotificacaoDto extends PartialType(CreateLogNotificacaoDto) {}
