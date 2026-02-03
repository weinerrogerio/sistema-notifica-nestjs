import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './notification-email.service';
import { LogNotificationQueryService } from '@app/log-notificacao/services/log-notification-search.service';
import { ContatoTabelionatoService } from '@app/contato-tabelionato/contato-tabelionato.service';
import { SendNotification } from '../dto/send-notification.dto';
import {
  NotificationData,
  NotificationResult,
  NotificationResultAll,
} from '@app/common/interfaces/notification-data.interface';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';

@Injectable()
export class NotificationOrchestratorService {
  private readonly logger = new Logger(NotificationOrchestratorService.name);

  constructor(
    private configService: ConfigService,
    private logNotificationQueryService: LogNotificationQueryService,
    private logNotificationService: LogNotificacaoService,
    private emailService: EmailService,
    private contatoTabelionatoService: ContatoTabelionatoService,
  ) {}

  /**
   * Envia múltiplas notificações pendentes
   */
  async sendNotifications(): Promise<NotificationResultAll> {
    this.logger.log('🚀 Iniciando envio em lote de notificações');

    // Buscar notificações pendentes (não enviadas)
    const intimacoesPendentes =
      await this.logNotificationQueryService.buscarNotificacoesPendentesNaoEnviadas();

    this.logger.log(
      `📊 Total de notificações pendentes: ${intimacoesPendentes.length}`,
    );

    const resultados: NotificationResultAll = {
      enviados: 0,
      erros: 0,
      detalhes: [],
    };

    // Processar cada notificação
    for (const intimacao of intimacoesPendentes) {
      try {
        // Validação básica
        if (!intimacao.devedorEmail || intimacao.devedorEmail.trim() === '') {
          this.logger.warn(
            `⚠️ Email vazio para notificação ${intimacao.logNotificacaoId}`,
          );

          resultados.erros++;
          resultados.detalhes.push({
            id: intimacao.logNotificacaoId,
            email: intimacao.devedorEmail,
            sucesso: false,
            erro: 'Email não informado',
          });
          continue;
        }

        // Enviar notificação
        const resultado = await this.sendOneNotification(intimacao);

        if (resultado.success) {
          resultados.enviados++;
          resultados.detalhes.push({
            id: intimacao.logNotificacaoId,
            email: intimacao.devedorEmail,
            sucesso: true,
          });
        } else {
          resultados.erros++;
          resultados.detalhes.push({
            id: intimacao.logNotificacaoId,
            email: intimacao.devedorEmail,
            sucesso: false,
            erro: resultado.message || 'Falha no envio',
          });
        }
      } catch (error) {
        this.logger.error(
          `❌ Erro ao processar notificação ${intimacao.logNotificacaoId}: ${error.message}`,
        );

        resultados.erros++;
        resultados.detalhes.push({
          id: intimacao.logNotificacaoId,
          email: intimacao.devedorEmail,
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    this.logger.log(
      `✅ Envio concluído: ${resultados.enviados} enviados, ${resultados.erros} erros`,
    );

    return resultados;
  }

  /**
   * Envia uma única notificação
   */
  async sendOneNotification(
    dadosRequisicao: SendNotification,
  ): Promise<NotificationResult> {
    try {
      this.logger.log(
        `📧 Processando notificação ${dadosRequisicao.logNotificacaoId}`,
      );

      // 1. Buscar dados completos da notificação
      const dadosCompletos =
        await this.logNotificationQueryService.buscarNotificacaoPendenteAllDataById(
          dadosRequisicao.logNotificacaoId,
        );

      // 2. Validar dados
      if (!dadosCompletos || dadosCompletos.length === 0) {
        const errorMessage = `Notificação não encontrada: ID ${dadosRequisicao.logNotificacaoId}`;
        this.logger.error(errorMessage);
        return { success: false, message: errorMessage };
      }

      const dados = dadosCompletos[0];

      // 3. Validações essenciais
      const validacao = this.validarDadosNotificacao(dados);
      if (!validacao.valido) {
        this.logger.error(validacao.mensagem);
        return { success: false, message: validacao.mensagem };
      }

      // 4. Buscar dados do cartório
      const dadosCartorio = await this.contatoTabelionatoService.findOneByName(
        dados.protesto.cart_protesto,
      );

      // 5. Montar ViewModel
      const viewModel = this.montarViewModel(dados, dadosCartorio);

      // 6. Enviar email
      this.logger.log(
        `📤 Enviando email para: ${dados.devedor.email} (ID: ${dados.id})`,
      );

      const emailResult = await this.emailService.sendNotification(viewModel);

      // 7. Atualizar status no banco
      if (emailResult.success) {
        await this.logNotificationService.marcarComoEnviada(
          dados.id,
          //1, // Template ID (ajustar se necessário)
          //emailResult.messageId,
        );

        this.logger.log(
          `✅ Notificação ${dados.id} enviada com sucesso! Message ID: ${emailResult.messageId}`,
        );

        return {
          success: true,
          message: 'Email enviado com sucesso',
          //messageId: emailResult.messageId,
        };
      } else {
        this.logger.error(
          `❌ Falha ao enviar notificação ${dados.id}: ${emailResult.error}`,
        );

        return {
          success: false,
          message: emailResult.error || 'Erro no envio pelo Brevo',
        };
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro no orchestrator para notificação ${dadosRequisicao.logNotificacaoId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Valida dados essenciais da notificação
   */
  private validarDadosNotificacao(dados: any): {
    valido: boolean;
    mensagem?: string;
  } {
    if (!dados.devedor?.email) {
      return {
        valido: false,
        mensagem: 'Email do devedor não encontrado',
      };
    }

    if (!dados.protesto?.cart_protesto) {
      return {
        valido: false,
        mensagem: 'Cartório de protesto não encontrado',
      };
    }

    if (!dados.protesto?.num_titulo) {
      return {
        valido: false,
        mensagem: 'Número do título não encontrado',
      };
    }

    return { valido: true };
  }

  /**
   * Monta o ViewModel para renderização do template
   */
  private montarViewModel(dados: any, dadosCartorio: any): NotificationData {
    // Extrair credor
    const primeiroCredor = dados.protesto?.credores?.[0]?.credor;
    const nomeCredor =
      primeiroCredor?.sacador || primeiroCredor?.cedente || 'Não informado';
    const docCredor = primeiroCredor?.doc_credor || 'Não informado';

    // Funções auxiliares
    const formatarData = (data: Date | string): string => {
      if (!data) return 'N/A';

      if (
        typeof data === 'string' &&
        !data.includes('-') &&
        !data.includes('/')
      ) {
        return data; // "a vista" ou similar
      }

      const dateObj = new Date(data);
      if (isNaN(dateObj.getTime())) return data.toString();

      return dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const formatarValor = (valor?: number): string => {
      if (valor === null || valor === undefined) return 'R$ 0,00';
      return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    };

    // Montar ViewModel
    const viewModel: NotificationData = {
      devedor: {
        nome: dados.devedor?.nome || 'Não informado',
        documento: dados.devedor?.doc_devedor || 'Não informado',
        email: dados.devedor.email,
        tipo: dados.devedor?.devedor_pj ? 'PJ' : 'PF',
      },
      titulo: {
        numero: dados.protesto?.num_titulo || 'Não informado',
        valor: formatarValor(dados.protesto?.valor),
        saldo: formatarValor(dados.protesto?.saldo),
        vencimento: formatarData(dados.protesto?.vencimento),
      },
      distribuicao: {
        numero: dados.protesto?.num_distribuicao || 'Não informado',
        data: formatarData(dados.protesto?.data_distribuicao),
        dataApresentacao: formatarData(dados.protesto?.data_apresentacao),
      },
      cartorio: {
        nome: dadosCartorio?.nomeTabelionato || 'Não informado',
        codigo: dadosCartorio?.codTabelionato || 'Não informado',
        telefone: dadosCartorio?.telefone || 'Não informado',
        email: dadosCartorio?.email || 'Não informado',
        endereco: dadosCartorio?.endereco || 'Não informado',
        cidade: dadosCartorio?.cidade || 'Não informado',
        uf: dadosCartorio?.uf || 'Não informado',
        cep: dadosCartorio?.cep || 'Não informado',
      },
      credor: {
        nome: nomeCredor,
        documento: docCredor,
        tipo: primeiroCredor?.cedente ? 'cedente' : 'sacador',
      },
      portador: {
        nome: dados.protesto?.apresentante?.nome || 'Não informado',
        codigo:
          dados.protesto?.apresentante?.cod_apresentante || 'Não informado',
      },
      urls: {
        // Adicionar URLs se necessário
      },
      metadata: {
        notificacaoId: dados.id,
        dataEnvio: new Date().toISOString(),
      },
    };

    return viewModel;
  }
}
