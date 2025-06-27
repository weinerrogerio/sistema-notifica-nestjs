import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocProtesto } from '../entities/doc-protesto.entity';
import { LogNotificacao } from '../../log-notificacao/entities/log-notificacao.entity';
import { Devedor } from '../../devedor/entities/devedor.entity';
import {
  DistribuicaoSearchResult,
  FiltrosDistribuicao,
} from '@app/common/interfaces/doc-protesto.interface';

@Injectable()
export class DocProtestoSearchService {
  constructor(
    @InjectRepository(DocProtesto)
    private docProtestoRepository: Repository<DocProtesto>,
    @InjectRepository(LogNotificacao)
    private logNotificacaoRepository: Repository<LogNotificacao>,
    @InjectRepository(Devedor)
    private devedorRepository: Repository<Devedor>,
  ) {}

  async buscarDistribuicoesPorDevedor(
    devedorId: number,
  ): Promise<DistribuicaoSearchResult[]> {
    const distribuicoes = await this.docProtestoRepository
      .createQueryBuilder('protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .leftJoinAndSelect('protesto.notificacao', 'logNotificacao')
      .leftJoinAndSelect('logNotificacao.devedor', 'devedor')
      .where('devedor.id = :devedorId', { devedorId })
      .orderBy('protesto.data_distribuicao', 'DESC')
      .getMany();

    return this.mapearParaDistribuicaoResult(distribuicoes);
  }

  async buscarDistribuicoesComFiltros(
    filtros: FiltrosDistribuicao,
  ): Promise<DistribuicaoSearchResult[]> {
    const queryBuilder = this.docProtestoRepository
      .createQueryBuilder('protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .leftJoinAndSelect('protesto.notificacao', 'logNotificacao')
      .leftJoinAndSelect('logNotificacao.devedor', 'devedor');

    queryBuilder.andWhere('devedor.email IS NOT NULL');
    // Aplicar filtros dinamicamente
    if (filtros.devedorNome) {
      queryBuilder.andWhere('devedor.nome LIKE :devedorNome', {
        devedorNome: `%${filtros.devedorNome}%`,
      });
    }

    if (filtros.docDevedor) {
      queryBuilder.andWhere('devedor.doc_devedor = :docDevedor', {
        docDevedor: filtros.docDevedor,
      });
    }

    if (filtros.email) {
      queryBuilder.andWhere('devedor.email LIKE :email', {
        email: `%${filtros.email}%`,
      });
    }

    if (filtros.dataInicio && filtros.dataFim) {
      queryBuilder.andWhere(
        'protesto.data_distribuicao BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
      );
    }

    // Adicionar outros filtros conforme necessário
    const distribuicoes = await queryBuilder
      .orderBy('protesto.data_distribuicao', 'DESC')
      .getMany();

    return this.mapearParaDistribuicaoResult(distribuicoes);
  }

  // Busca específica para relatórios ou dashboards
  async obterEstatisticasDistribuicoes(filtros: FiltrosDistribuicao) {
    const queryBuilder = this.docProtestoRepository
      .createQueryBuilder('protesto')
      .leftJoin('protesto.notificacao', 'logNotificacao')
      .leftJoin('logNotificacao.devedor', 'devedor')
      .select([
        'COUNT(protesto.id) as totalDistribuicoes',
        'SUM(protesto.valor) as valorTotal',
        'AVG(protesto.valor) as valorMedio',
        'COUNT(CASE WHEN logNotificacao.email_enviado = true THEN 1 END) as notificacoesEnviadas',
        'COUNT(CASE WHEN logNotificacao.email_enviado = false THEN 1 END) as notificacoesPendentes',
      ]);

    // Aplicar mesmos filtros...
    if (filtros.dataInicio && filtros.dataFim) {
      queryBuilder.andWhere(
        'protesto.data_distribuicao BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
      );
    }

    return await queryBuilder.getRawOne();
  }

  private mapearParaDistribuicaoResult(
    distribuicoes: DocProtesto[],
  ): DistribuicaoSearchResult[] {
    return distribuicoes.map((protesto) => {
      // Pegar o primeiro devedor da primeira notificação (pode haver múltiplos)
      const primeiraNotificacao = protesto.notificacao?.[0];
      const devedor = primeiraNotificacao?.devedor;

      return {
        id: protesto.id,
        numDistribuicao: protesto.num_distribuicao,
        dataDistribuicao: protesto.data_distribuicao,
        dataApresentacao: protesto.data_apresentacao,
        cartProtesto: protesto.cart_protesto,
        numTitulo: protesto.num_titulo,
        valor: protesto.valor,
        saldo: protesto.saldo,
        vencimento: protesto.vencimento,
        devedor: devedor
          ? {
              id: devedor.id,
              nome: devedor.nome,
              docDevedor: devedor.doc_devedor,
              email: devedor.email,
              devedorPj: devedor.devedor_pj,
            }
          : null,
        apresentante: protesto.apresentante
          ? {
              id: protesto.apresentante.id,
              nome: protesto.apresentante.nome, // Assumindo que existe campo nome na entidade Apresentante
            }
          : null,
        credores:
          protesto.credores?.map((docCredor) => ({
            id: docCredor.credor.id,
            // Adicione aqui os campos que existem na sua entidade Credor
            //nome: docCredor.credor.nome,
            sacador: docCredor.credor.sacador,
            cedente: docCredor.credor.cedente,
            // documento: docCredor.credor.documento,
          })) || [],
        statusNotificacao: primeiraNotificacao
          ? {
              emailEnviado: primeiraNotificacao.email_enviado,
              dataEnvio: primeiraNotificacao.data_envio,
              lido: primeiraNotificacao.lido,
              dataLeitura: primeiraNotificacao.data_leitura,
              trackingToken: primeiraNotificacao.tracking_token,
            }
          : undefined,
      };
    });
  }
}
