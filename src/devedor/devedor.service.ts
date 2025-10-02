import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';
import { IsNull, Not, Repository } from 'typeorm';
import {
  EmailLookupService,
  SearchProgress,
  LogMessage,
} from '@app/email-lookup/email-lookup.service';
import {
  EmailResult,
  EmailUpdateResult,
} from '@app/common/interfaces/email.interface';

// Interface para gerenciar sessões de busca
export interface SearchSession {
  id: string;
  cancelled: boolean;
  startTime: Date;
  progress?: SearchProgress;
  // Adiciona callback para logs em tempo real
  logCallback?: (log: LogMessage) => void;
}

@Injectable()
export class DevedorService {
  private readonly logger = new Logger(DevedorService.name);

  // Map para gerenciar sessões de busca ativas
  private readonly activeSessions = new Map<string, SearchSession>();

  constructor(
    @InjectRepository(Devedor)
    private readonly devedorRepository: Repository<Devedor>,
    private readonly emailLookupService: EmailLookupService,
  ) {}

  // Gera um ID único para a sessão de busca
  private generateSessionId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Inicia uma nova sessão de busca
  createSearchSession(): string {
    const sessionId = this.generateSessionId();
    this.activeSessions.set(sessionId, {
      id: sessionId,
      cancelled: false,
      startTime: new Date(),
    });

    this.logger.log(`Nova sessão de busca criada: ${sessionId}`);
    return sessionId;
  }

  // Registra um callback para logs da sessão
  setSessionLogCallback(
    sessionId: string,
    callback: (log: LogMessage) => void,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.logCallback = callback;
    }
  }

  // Cancela uma sessão de busca
  cancelSearchSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.cancelled = true;
      this.logger.log(`Sessão de busca cancelada: ${sessionId}`);
      return true;
    }
    return false;
  }

  // Remove uma sessão (quando concluída ou cancelada)
  private cleanupSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.logger.log(`Sessão de busca removida: ${sessionId}`);
  }

  // Verifica se uma sessão foi cancelada
  private isSessionCancelled(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    return session ? session.cancelled : true; // Se não existe, considera cancelada
  }

  // Atualiza o progresso da sessão
  private updateSessionProgress(
    sessionId: string,
    progress: SearchProgress,
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.progress = progress;
    }
  }

  // Obtém o progresso atual da sessão
  getSessionProgress(sessionId: string): SearchProgress | null {
    const session = this.activeSessions.get(sessionId);
    return session?.progress || null;
  }

  // Lista todas as sessões ativas
  getActiveSessions(): SearchSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Obtém callback de log da sessão
  getSessionLogCallback(
    sessionId: string,
  ): ((log: LogMessage) => void) | undefined {
    const session = this.activeSessions.get(sessionId);
    return session?.logCallback;
  }

  async create(createDevedorDto: CreateDevedorDto) {
    try {
      const newDevedorDto = {
        nome: createDevedorDto?.nome,
        doc_devedor: createDevedorDto?.doc_devedor,
        devedor_pj: createDevedorDto?.devedor_pj,
      };
      const newDevedor = this.devedorRepository.create(newDevedorDto);
      await this.devedorRepository.save(newDevedor);
      return newDevedor;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Email ja cadastrado');
      }
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }

  async findOrCreate(createDevedorDto: CreateDevedorDto) {
    try {
      const existingDevedor = await this.findOneByDoc(
        createDevedorDto.doc_devedor,
      );
      if (existingDevedor) {
        return existingDevedor;
      }
      return await this.create(createDevedorDto);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Devedor já cadastrado');
      }
      throw error;
    }
  }

  async findOneByDoc(doc_devedor: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { doc_devedor: doc_devedor },
    });
    return devedor;
  }

  async findOneByEmail(email: string) {
    const devedor = await this.devedorRepository.findOne({
      where: { email: email },
    });
    return devedor;
  }

  async findOneByPj() {
    const devedor = await this.devedorRepository.findOne({
      where: { email: null, devedor_pj: true },
    });
    return devedor;
  }

  async findAllByPj() {
    const devedor = await this.devedorRepository.find({
      where: { email: null, devedor_pj: true },
    });
    return devedor;
  }

  async findAllByPjNotSearched() {
    const devedor = await this.devedorRepository.find({
      where: { email: null, devedor_pj: true, email_searched: false },
    });
    return devedor;
  }
  async findOne(id: number) {
    const devedor = await this.devedorRepository.findOne({ where: { id: id } });
    if (!devedor || !devedor.id) throw new Error('Usuário não encontrado');
    return devedor;
  }

  findAll() {
    return `This action returns all devedor`;
  }

  update(id: number, updateDevedorDto: UpdateDevedorDto) {
    console.log(updateDevedorDto);
    return `This action updates a #${id} devedor`;
  }

  remove(id: number) {
    return `This action removes a #${id} devedor`;
  }

  //ALERTA ------- USAR APENAS EM TESTE
  async updateAllEmailTeste() {
    try {
      const devedores = await this.devedorRepository.find({
        where: {
          email: Not(IsNull()),
        },
      });
      for (const devedor of devedores) {
        devedor.email = 'weinerrogerio@gmail.com';
      }

      const result = await this.devedorRepository.save(devedores);
      return { updated: result.length };
    } catch (error) {
      console.error('Erro ', error);
      throw error;
    }
  }

  async updateEmailSearched(id: number): Promise<void> {
    try {
      const updateResult = await this.devedorRepository.update(
        { id: id },
        { email_searched: true },
      );
      if (updateResult.affected === 0) {
        console.warn(`Aviso: Nenhuma linha atualizada para o ID: ${id}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar email_searched:', error);
      throw error;
    }
  }

  async updateEmail(
    resultadosEmails: EmailResult[],
  ): Promise<EmailUpdateResult[]> {
    const updates: EmailUpdateResult[] = [];

    for (const resultado of resultadosEmails) {
      if (resultado.email) {
        try {
          const cnpjLimpo = resultado.cnpj.replace(/[^\d]/g, '');
          const devedor = await this.devedorRepository.findOne({
            where: { doc_devedor: cnpjLimpo },
          });

          if (devedor) {
            await this.devedorRepository.update(
              { id: devedor.id },
              { email: resultado.email, email_searched: true },
            );

            updates.push({
              id: devedor.id,
              cnpj: devedor.doc_devedor,
              email: resultado.email,
            });
          } else {
            this.logger.warn(
              `Devedor não encontrado para CNPJ: ${resultado.cnpj}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao atualizar email para CNPJ ${resultado.cnpj}:`,
            error,
          );
        }
      }
    }

    this.logger.log(`${updates.length} emails atualizados`);
    return updates;
  }

  // Versão principal com suporte a cancelamento e progresso -----------------------------------------------
  async buscarEmailsDevedores(
    sessionId?: string,
    progressCallback?: (progress: SearchProgress) => void,
  ) {
    const searchSessionId = sessionId || this.createSearchSession();

    try {
      this.logger.log(
        `Iniciando busca de emails para devedores (sessão: ${searchSessionId})`,
      );

      const devedores = await this.findAllByPjNotSearched();

      if (!devedores || devedores.length === 0) {
        this.cleanupSession(searchSessionId);
        return {
          sessionId: searchSessionId,
          emails: [],
          estatisticas: {
            total: 0,
            encontrados: 0,
            naoEncontrados: 0,
            taxaSucesso: '0%',
          },
          cancelled: false,
        };
      }

      this.logger.log(`${devedores.length} devedores pendentes de busca`);

      const cnpjs = [...new Set(devedores.map((d) => d.doc_devedor))];
      const cancellationToken = () => this.isSessionCancelled(searchSessionId);

      const wrappedProgressCallback = (progress: SearchProgress) => {
        this.updateSessionProgress(searchSessionId, progress);
        if (progressCallback) {
          progressCallback(progress);
        }
      };

      const logCallback = this.getSessionLogCallback(searchSessionId);

      // ✅ REMOVE O TRY-CATCH que descartava resultados
      const resultadosEmails =
        await this.emailLookupService.buscarEmailsPorCNPJs(
          cnpjs,
          cancellationToken,
          wrappedProgressCallback,
          logCallback,
        );

      // ✅ Verifica se foi cancelado baseado na quantidade de resultados
      const cancelled = resultadosEmails.length < cnpjs.length;

      this.logger.log(
        `Busca ${cancelled ? 'CANCELADA' : 'CONCLUÍDA'} - Processados: ${resultadosEmails.length}/${cnpjs.length}`,
      );

      let emailsAtualizados: EmailUpdateResult[] = [];

      // ✅ SALVA TUDO QUE FOI ENCONTRADO, mesmo que cancelado
      if (resultadosEmails?.length > 0) {
        const resultadosComEmail = resultadosEmails.filter((r) => r.email);

        this.logger.log(
          `Salvando ${resultadosComEmail.length} emails encontrados`,
        );

        if (resultadosComEmail.length > 0) {
          emailsAtualizados = await this.updateEmail(resultadosComEmail);
        }

        // Marca como pesquisado apenas os CNPJs que foram processados
        const cnpjsProcessados = new Set(
          resultadosEmails.map((r) => r.cnpj.replace(/[^\d]/g, '')),
        );
        const devedoresProcessados = devedores.filter((d) =>
          cnpjsProcessados.has(d.doc_devedor.replace(/[^\d]/g, '')),
        );

        this.logger.log(
          `Marcando ${devedoresProcessados.length} devedores como pesquisados`,
        );

        for (const devedor of devedoresProcessados) {
          await this.updateEmailSearched(devedor.id);
        }
      }

      const devedoresComEmail = this.combinarDevedoresComEmails(
        devedores,
        resultadosEmails || [],
      );

      const estatisticas = this.emailLookupService.gerarEstatisticas(
        resultadosEmails || [],
      );

      this.logger.log(
        `RESUMO - Total: ${estatisticas.total}, Encontrados: ${estatisticas.encontrados}, Salvos: ${emailsAtualizados.length}, Cancelado: ${cancelled}`,
      );

      return {
        sessionId: searchSessionId,
        emails: devedoresComEmail,
        emailsAtualizados,
        estatisticas,
        cancelled,
      };
    } catch (error) {
      this.logger.error(
        `Erro na busca de emails (sessão: ${searchSessionId}):`,
        error,
      );
      throw error;
    } finally {
      this.cleanupSession(searchSessionId);
    }
  }

  private combinarDevedoresComEmails(
    devedores: Devedor[],
    emails: EmailResult[],
  ): Array<{
    id: number;
    cnpj: string;
    nome: string;
    email: string | null;
    fonte: string | null;
    dataBusca: Date;
  }> {
    return devedores.map((devedor) => {
      const emailEncontrado = emails.find(
        (e) =>
          e.cnpj.replace(/[^\d]/g, '') ===
          devedor.doc_devedor.replace(/[^\d]/g, ''),
      );

      return {
        id: devedor.id,
        cnpj: devedor.doc_devedor,
        nome: devedor.nome,
        email: emailEncontrado?.email || null,
        fonte: emailEncontrado?.fonte || null,
        dataBusca: new Date(),
      };
    });
  }
}
