import { BadRequestException, Injectable } from '@nestjs/common';
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

  async buscarDistribuicoesComFiltros(filtros: FiltrosDistribuicao) {
    const queryBuilder = this.docProtestoRepository
      .createQueryBuilder('protesto')
      .leftJoinAndSelect('protesto.apresentante', 'apresentante')
      .leftJoinAndSelect('protesto.credores', 'docProtestoCredor')
      .leftJoinAndSelect('docProtestoCredor.credor', 'credor')
      .leftJoinAndSelect('protesto.notificacao', 'logNotificacao')
      .leftJoinAndSelect('logNotificacao.devedor', 'devedor');
    //queryBuilder.andWhere('devedor.email IS NOT NULL');

    //validaçaõ se chegou algum filtro
    const temFiltro = Object.values(filtros).some(
      (valor) => valor !== undefined && valor !== null,
    );
    if (!temFiltro) {
      throw new BadRequestException('Ao menos um filtro deve ser fornecido');
    }

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
      // Normaliza para lowercase para aceitar "True", "true", "TRUE"
      const emailFilter = filtros.email.toLowerCase();

      if (emailFilter === 'true') {
        // Lógica: Trazer apenas quem TEM email preenchido
        queryBuilder.andWhere('devedor.email IS NOT NULL');
        queryBuilder.andWhere("devedor.email != ''");
      } else if (emailFilter === 'false') {
        // Lógica: Trazer apenas quem NÃO tem email (opcional, mas bom ter)
        queryBuilder.andWhere("(devedor.email IS NULL OR devedor.email = '')");
      } else {
        // Lógica original: Busca por parte do texto do email (ex: "gmail.com")
        queryBuilder.andWhere('devedor.email LIKE :email', {
          email: `%${filtros.email}%`,
        });
      }
    }

    // Filtro por Número de Distribuição
    if (filtros.numDistribuicao) {
      queryBuilder.andWhere('protesto.num_distribuicao = :numDist', {
        numDist: filtros.numDistribuicao,
      });
    }

    // Filtro por Número do Título
    if (filtros.numTitulo) {
      queryBuilder.andWhere('protesto.num_titulo = :numTitulo', {
        numTitulo: filtros.numTitulo,
      });
    }

    if (filtros.docCredor) {
      queryBuilder.andWhere('credor.doc_credor = :docCredor', {
        docCredor: filtros.docCredor,
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

    // Limite de segurança para não travar o banco se vier sem filtro nenhum
    if (filtros.limit) {
      queryBuilder.take(filtros.limit);
    }

    const distribuicoes = await queryBuilder
      .orderBy('protesto.data_distribuicao', 'DESC')
      .getMany();

    //return this.mapearParaDistribuicaoResult(distribuicoes);
    return distribuicoes;
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
      //const devedor = primeiraNotificacao?.devedor;

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
        devedor: protesto.notificacao?.map((dado) => ({
          id: dado.devedor.id,
          nome: dado.devedor.nome,
          docDevedor: dado.devedor.doc_devedor,
          email: dado.devedor.email,
          devedorPj: dado.devedor.devedor_pj,
        })) /* devedor
          ? {
              id: devedor.id,
              nome: devedor.nome,
              docDevedor: devedor.doc_devedor,
              email: devedor.email,
              devedorPj: devedor.devedor_pj,
            }
          : null, */,
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
