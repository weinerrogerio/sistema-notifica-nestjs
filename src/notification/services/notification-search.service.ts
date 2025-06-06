import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';

@Injectable()
export class NotificationQueryService {
  private readonly logger = new Logger(NotificationQueryService.name);

  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {}

  // Buscar notificações não enviadas de devedores que possuem email
  async buscarNotificacoesPendentes(): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('devedor.email IS NOT NULL')
      .andWhere('devedor.email != :emptyEmail', { emptyEmail: '' })
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Versão corrigida da função original
  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('devedor.nome = :devedorNome', { devedorNome })
      .andWhere('protesto.num_distribuicao = :numDistribuicaoProtesto', {
        numDistribuicaoProtesto,
      })
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Buscar notificações por devedor específico (que ainda não foram enviadas)
  async buscarNotificacoesPendentesPorDevedor(
    devedorId: number,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('devedor.id = :devedorId', { devedorId })
      .andWhere('devedor.email IS NOT NULL')
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Buscar notificações por número de distribuição (não enviadas)
  async buscarNotificacoesPendentesPorDistribuicao(
    numDistribuicao: string,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .where('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: false,
      })
      .andWhere('protesto.num_distribuicao = :numDistribuicao', {
        numDistribuicao,
      })
      .andWhere('devedor.email IS NOT NULL')
      .getMany();

    return this.mapearParaIntimacaoData(logNotificacoes);
  }

  // Buscar todas as notificações com paginação
  async buscarNotificacoesComPaginacao(
    page: number = 1,
    limit: number = 10,
    filtros?: {
      emailEnviado?: boolean;
      devedorComEmail?: boolean;
      dataInicio?: Date;
      dataFim?: Date;
    },
  ): Promise<{
    dados: IntimacaoData[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    const queryBuilder = this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.protesto', 'protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor');

    // Aplicar filtros se fornecidos
    if (filtros?.emailEnviado !== undefined) {
      queryBuilder.andWhere('log_notificacao.email_enviado = :emailEnviado', {
        emailEnviado: filtros.emailEnviado,
      });
    }

    if (filtros?.devedorComEmail) {
      queryBuilder.andWhere('devedor.email IS NOT NULL');
      queryBuilder.andWhere('devedor.email != :emptyEmail', { emptyEmail: '' });
    }

    if (filtros?.dataInicio) {
      queryBuilder.andWhere('log_notificacao.createdAt >= :dataInicio', {
        dataInicio: filtros.dataInicio,
      });
    }

    if (filtros?.dataFim) {
      queryBuilder.andWhere('log_notificacao.createdAt <= :dataFim', {
        dataFim: filtros.dataFim,
      });
    }

    // Contar total de registros
    const total = await queryBuilder.getCount();

    // Aplicar paginação
    const logNotificacoes = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('log_notificacao.createdAt', 'DESC')
      .getMany();

    const dados = this.mapearParaIntimacaoData(logNotificacoes);
    const totalPaginas = Math.ceil(total / limit);

    return {
      dados,
      total,
      pagina: page,
      totalPaginas,
    };
  }

  // Função para marcar notificações como enviadas
  async marcarComoEnviada(logNotificacaoId: number): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoId, {
      email_enviado: true,
      data_envio: new Date(),
    });
  }

  // Função para marcar múltiplas notificações como enviadas
  async marcarMultiplasComoEnviadas(
    logNotificacaoIds: number[],
  ): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoIds, {
      email_enviado: true,
      data_envio: new Date(),
    });
  }

  // Função auxiliar para mapear os dados
  private mapearParaIntimacaoData(
    logNotificacoes: LogNotificacao[],
  ): IntimacaoData[] {
    return logNotificacoes.map((logNotificacao) => {
      // Obter o primeiro credor associado ao protesto
      const primeiroCredor = logNotificacao.protesto?.credores?.[0]?.credor;

      // Determinar o nome do credor (prioritariamente cedente, depois sacador)
      let nomeCredor = 'Não informado';
      if (primeiroCredor) {
        nomeCredor =
          primeiroCredor.cedente || primeiroCredor.sacador || 'Não informado';
      }

      return {
        logNotificacaoId: logNotificacao.id,
        nomeDevedor: logNotificacao.devedor?.nome || '',
        devedorEmail: logNotificacao.devedor?.email || '',
        docDevedor: logNotificacao.devedor?.doc_devedor || '',
        distribuicao: logNotificacao.protesto?.num_distribuicao || '',
        dataDistribuicao:
          logNotificacao.protesto?.data_distribuicao || new Date(),
        valorTotal: logNotificacao.protesto?.valor || 0,
        dataVencimento: logNotificacao.protesto?.vencimento || '',
        tabelionato: logNotificacao.protesto?.cart_protesto || '',
        credor: nomeCredor,
        portador:
          logNotificacao.protesto?.apresentante?.nome || 'Não informado',
      };
    });
  }
}
