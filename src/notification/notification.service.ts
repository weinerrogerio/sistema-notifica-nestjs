import { IntimacaoData } from '@app/common/interfaces/notification-data.interface';
import { DocProtestoService } from '@app/doc-protesto/doc-protesto.service';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    private readonly logNotificacaoService: LogNotificacaoService,
    private readonly docProtestoService: DocProtestoService,
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
  ) {}
  async enviarNotificacao() {
    return true;
  }
  async buscarIntimacao(
    logNotificacaoId: number,
  ): Promise<IntimacaoData | null> {
    const logNotificacao = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.docProtesto', 'docProtesto')
      .where('log_notificacao.id = :id', { id: logNotificacaoId })
      .getOne();

    if (!logNotificacao) {
      return null; // Notificação não encontrada
    }

    // Mapear os dados para a interface IntimacaoData
    const intimacaoData: IntimacaoData = {
      // Dados do devedor
      nomeDevedor: logNotificacao.devedor?.nome,
      devedorEmail: logNotificacao.devedor?.email,
      docDevedor: logNotificacao.devedor?.doc_devedor,

      // Dados do título
      distribuicao: logNotificacao.protesto?.num_distribuicao,
      dataDistribuicao: logNotificacao.protesto?.data_distribuicao,
      // **VALOR TOTAL: ESTE CAMPO NÃO EXISTE NO DER.**
      // Você precisará adicioná-lo à tabela `doc_protesto` se for necessário,
      // ou calculá-lo se for derivado de outros campos.
      // Por enquanto, será 0 ou undefined.
      valorTotal: 0, // <<-- ATENÇÃO: Campo ausente no DER!
      dataVencimento: logNotificacao.protesto?.vencimento,
      tabelionato: logNotificacao.protesto?.cart_protesto,

      // Dados do portador/credor
      credor: String(logNotificacao.protesto?.credores), // fkCredor (assumindo que seja o nome ou código do credor)

      // Dados apresentante
      // **APRESENTANTE: fkApresentante é um ID (integer).**
      // Se você precisa do nome do apresentante, precisaria de uma tabela `apresentante`
      // e uma nova relação no `doc_protesto`. Por agora, usaremos o ID diretamente.
      portador: String(logNotificacao.protesto?.fk_apresentante), // Ou null/undefined se não for string
    };

    return intimacaoData;
  }

  // Exemplo de busca por um devedor específico e um protesto
  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    const logNotificacoes = await this.logNotificacaoRepository
      .createQueryBuilder('log_notificacao')
      .leftJoinAndSelect('log_notificacao.devedor', 'devedor')
      .leftJoinAndSelect('log_notificacao.docProtesto', 'docProtesto')
      .where('devedor.nome = :devedorNome', { devedorNome })
      .andWhere('docProtesto.numDistribuicao = :numDistribuicaoProtesto', {
        numDistribuicaoProtesto,
      })
      .getMany();

    return logNotificacoes.map((logNotificacao) => ({
      nomeDevedor: logNotificacao.devedor?.nome,
      devedorEmail: logNotificacao.devedor?.email,
      docDevedor: logNotificacao.devedor?.doc_devedor,
      distribuicao: logNotificacao.protesto?.num_distribuicao,
      dataDistribuicao: logNotificacao.protesto?.data_distribuicao,
      valorTotal: 0, // <<-- ATENÇÃO: Campo ausente no DER!
      dataVencimento: logNotificacao.protesto?.vencimento,
      tabelionato: logNotificacao.protesto?.cart_protesto,
      credor: String(logNotificacao.protesto?.credores),
      portador: String(logNotificacao.protesto?.fk_apresentante),
    }));
  }
}
