import { DocProtestoService } from '@app/doc-protesto/doc-protesto.service';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  constructor(
    private readonly logNotificacaoService: LogNotificacaoService,
    private readonly docProtestoService: DocProtestoService,
  ) {}
  async enviarNotificacao() {
    return true;
  }
}
