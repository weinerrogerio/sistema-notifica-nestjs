import { Injectable } from '@nestjs/common';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';
import { LogNotificacao } from './entities/log-notificacao.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LogNotificationQueryService } from './services/log-notification-search.service';
import {
  IntimacaoData,
  IntimacaoDataCompleto,
} from '@app/common/interfaces/notification-data.interface';
//NOTA: ALTERARA ENTIDADE--> LOG_NOTIFICACAO -> ADICIONAR COLUNA DE EMAIL ENCONTRADO, COLUNAR DE ENVIADO, E DATA DE ENVIO != DATA GRAVAÇÃO
@Injectable()
export class LogNotificacaoService {
  constructor(
    @InjectRepository(LogNotificacao)
    private readonly logNotificacaoRepository: Repository<LogNotificacao>,
    private readonly logNotificationQueryService: LogNotificationQueryService,
  ) {}
  async create(createLogNotificacaoDto: CreateLogNotificacaoDto) {
    console.log('createLogNotificacaoDto recebido:', createLogNotificacaoDto);
    const newLogDto = {
      email_enviado: false,
      lido: false,
      fk_devedor: createLogNotificacaoDto?.fk_devedor,
      fk_protesto: createLogNotificacaoDto?.fk_protesto,
    };
    console.log('newLogDto antes de criar:', newLogDto);
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    console.log('newLog após create:', newLog);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }

  findAll() {
    return `This action returns all logNotificacao`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logNotificacao`;
  }

  // update  data de envio, email enviado
  async updateEnvioEmail(
    id: number,
    updateLogNotificacaoDto: UpdateLogNotificacaoDto,
  ) {
    const newLogDto = {
      email_enviado: updateLogNotificacaoDto?.email_enviado,
      data_envio: updateLogNotificacaoDto?.data_envio,
      ...updateLogNotificacaoDto,
    };
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }

  // update lido
  async updateReceived(
    id: number,
    updateLogNotificacaoDto: UpdateLogNotificacaoDto,
  ) {
    const newLogDto = {
      lido: updateLogNotificacaoDto?.lido,
      ...updateLogNotificacaoDto,
    };
    const newLog = this.logNotificacaoRepository.create(newLogDto);
    await this.logNotificacaoRepository.save(newLog);
    return newLog;
  }
  async update(id: number, updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    return `This action updates a #${id} logNotificacao ${updateLogNotificacaoDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} logNotificacao`;
  }

  // ------------------------------------- Métodos de busca ------------------------------------- //

  async buscarNotificacoesPendentesAllData(): Promise<IntimacaoDataCompleto[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesAllData();
  }

  async buscarNotificacaoPendenteAllDataById(
    id: number,
  ): Promise<IntimacaoDataCompleto[]> {
    return this.logNotificationQueryService.buscarNotificacaoPendenteAllDataById(
      id,
    );
  }

  async buscarNotificacoesPendentesAll(): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesAll();
  }

  async buscarNotificacoesPendentesNaoEnviadas(): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesNaoEnviadas();
  }

  async buscarIntimacoesPorDevedorENumProtesto(
    devedorNome: string,
    numDistribuicaoProtesto: string,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarIntimacoesPorDevedorENumProtesto(
      devedorNome,
      numDistribuicaoProtesto,
    );
  }

  async buscarNotificacoesPendentesPorDevedor(
    devedorId: number,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesPorDevedor(
      devedorId,
    );
  }

  async buscarNotificacoesPendentesPorDistribuicao(
    numDistribuicao: string,
  ): Promise<IntimacaoData[]> {
    return this.logNotificationQueryService.buscarNotificacoesPendentesPorDistribuicao(
      numDistribuicao,
    );
  }

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
    return this.logNotificationQueryService.buscarNotificacoesComPaginacao(
      page,
      limit,
      filtros,
    );
  }

  async marcarComoEnviada(
    logNotificacaoId: number,
    templateId: number,
  ): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoId, {
      email_enviado: true,
      fk_template: templateId,
      data_envio: new Date(),
    });
  }

  async marcarMultiplasComoEnviadas(
    logNotificacaoIds: number[],
  ): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoIds, {
      email_enviado: true,
      data_envio: new Date(),
    });
  }

  async marcarComoLida(
    logNotificacaoId: number,
    dataLeitura: Date = new Date(),
  ): Promise<void> {
    await this.logNotificacaoRepository.update(logNotificacaoId, {
      lido: true,
      data_leitura: dataLeitura,
    });
  }
}
