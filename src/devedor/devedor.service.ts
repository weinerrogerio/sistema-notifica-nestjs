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

  // ⚙️ CONFIGURAÇÕES DE OTIMIZAÇÃO DE MEMÓRIA
  private readonly BATCH_SIZE = 5; // Processa 10 CNPJs por vez (ajustável: 5-20)
  private readonly BATCH_DELAY_MS = 300; // Delay entre lotes (ajustável: 0-500ms)
  private readonly DB_BATCH_SIZE = 20; // Salva no banco em lotes de 50 (ajustável: 20-100)

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

  // 🔄 FUNÇÃO AUXILIAR: Atualiza emails em LOTES no banco de dados
  // Nome anterior: N/A (nova função para otimização)
  private async updateEmailInBatches(
    resultadosEmails: EmailResult[],
  ): Promise<EmailUpdateResult[]> {
    const updates: EmailUpdateResult[] = [];
    const resultadosComEmail = resultadosEmails.filter((r) => r.email);

    // Processa em lotes para não sobrecarregar o banco
    for (let i = 0; i < resultadosComEmail.length; i += this.DB_BATCH_SIZE) {
      const batch = resultadosComEmail.slice(i, i + this.DB_BATCH_SIZE);

      const batchUpdates = await Promise.all(
        batch.map(async (resultado) => {
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

              return {
                id: devedor.id,
                cnpj: devedor.doc_devedor,
                email: resultado.email,
              };
            } else {
              this.logger.warn(
                `Devedor não encontrado para CNPJ: ${resultado.cnpj}`,
              );
              return null;
            }
          } catch (error) {
            this.logger.error(
              `Erro ao atualizar email para CNPJ ${resultado.cnpj}:`,
              error,
            );
            return null;
          }
        }),
      );

      updates.push(...batchUpdates.filter((u) => u !== null));

      // Log de progresso
      this.logger.log(
        `Salvos ${updates.length}/${resultadosComEmail.length} emails no banco`,
      );
    }

    this.logger.log(`Total de ${updates.length} emails atualizados`);
    return updates;
  }

  // 🔄 FUNÇÃO AUXILIAR: Marca devedores como pesquisados em LOTES
  // Nome anterior: N/A (nova função para otimização)
  private async markAsSearchedInBatches(
    devedores: Devedor[],
    cnpjsProcessados: Set<string>,
  ): Promise<void> {
    const devedoresProcessados = devedores.filter((d) =>
      cnpjsProcessados.has(d.doc_devedor.replace(/[^\d]/g, '')),
    );

    this.logger.log(
      `Marcando ${devedoresProcessados.length} devedores como pesquisados`,
    );

    // Processa em lotes
    for (let i = 0; i < devedoresProcessados.length; i += this.DB_BATCH_SIZE) {
      const batch = devedoresProcessados.slice(i, i + this.DB_BATCH_SIZE);

      await Promise.all(
        batch.map((devedor) => this.updateEmailSearched(devedor.id)),
      );

      this.logger.log(
        `Marcados ${Math.min(i + this.DB_BATCH_SIZE, devedoresProcessados.length)}/${devedoresProcessados.length} devedores`,
      );
    }
  }

  // ⚠️ FUNÇÃO ANTIGA (mantida para compatibilidade, mas NÃO RECOMENDADA)
  // Nome anterior: updateEmail
  // AVISO: Esta função não usa batching e pode causar problemas de memória
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

  // 🔄 FUNÇÃO AUXILIAR: Divide array em lotes menores
  // Nome anterior: N/A (nova função utilitária)
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // 🔄 FUNÇÃO AUXILIAR: Adiciona delay entre processamentos
  // Nome anterior: N/A (nova função utilitária)
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ✅ VERSÃO OTIMIZADA COM PROCESSAMENTO EM LOTES (STREAMING/BATCHING)
  // Nome anterior: buscarEmailsDevedores
  // NOVA IMPLEMENTAÇÃO: Processa CNPJs em pequenos lotes para economizar memória
  async buscarEmailsDevedores(
    sessionId?: string,
    progressCallback?: (progress: SearchProgress) => void,
  ) {
    const searchSessionId = sessionId || this.createSearchSession();

    try {
      this.logger.log(
        `[OTIMIZADO] Iniciando busca de emails em lotes (sessão: ${searchSessionId})`,
      );

      // 1️⃣ Busca devedores pendentes
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

      this.logger.log(
        `[OTIMIZADO] ${devedores.length} devedores pendentes | Batch size: ${this.BATCH_SIZE}`,
      );

      // 2️⃣ Extrai CNPJs únicos
      const cnpjs = [...new Set(devedores.map((d) => d.doc_devedor))];
      const totalCnpjs = cnpjs.length;

      // 3️⃣ Divide CNPJs em lotes menores
      const cnpjBatches = this.chunkArray(cnpjs, this.BATCH_SIZE);
      const totalBatches = cnpjBatches.length;

      this.logger.log(
        `[OTIMIZADO] ${totalCnpjs} CNPJs divididos em ${totalBatches} lotes de até ${this.BATCH_SIZE}`,
      );

      // 4️⃣ Variáveis para acumular resultados
      const todosResultados: EmailResult[] = [];
      let processedCount = 0;
      let cancelled = false;

      const cancellationToken = () => this.isSessionCancelled(searchSessionId);
      const logCallback = this.getSessionLogCallback(searchSessionId);

      // 5️⃣ PROCESSA CADA LOTE SEPARADAMENTE (streaming/batching)
      for (let batchIndex = 0; batchIndex < cnpjBatches.length; batchIndex++) {
        // Verifica cancelamento ANTES de cada lote
        if (cancellationToken()) {
          this.logger.log(
            `[OTIMIZADO] Busca CANCELADA no lote ${batchIndex + 1}/${totalBatches}`,
          );
          cancelled = true;
          break;
        }

        const currentBatch = cnpjBatches[batchIndex];
        const batchNumber = batchIndex + 1;

        this.logger.log(
          `[OTIMIZADO] Processando lote ${batchNumber}/${totalBatches} (${currentBatch.length} CNPJs)`,
        );

        // Atualiza progresso
        const progress: SearchProgress = {
          currentBatch: batchNumber,
          totalBatches: totalBatches,
          currentCnpj: currentBatch[0],
          processedCount,
          totalCount: totalCnpjs,
          message: `Processando lote ${batchNumber}/${totalBatches}`,
          timestamp: new Date(),
        };

        this.updateSessionProgress(searchSessionId, progress);
        if (progressCallback) {
          progressCallback(progress);
        }

        try {
          // 🔥 BUSCA EMAILS DESTE LOTE (libera memória após cada lote)
          const resultadosBatch =
            await this.emailLookupService.buscarEmailsPorCNPJs(
              currentBatch,
              cancellationToken,
              (batchProgress) => {
                // Ajusta progresso do lote para progresso global
                const globalProgress: SearchProgress = {
                  ...batchProgress,
                  currentBatch: batchNumber,
                  totalBatches: totalBatches,
                  processedCount:
                    processedCount + (batchProgress.processedCount || 0),
                  totalCount: totalCnpjs,
                };
                this.updateSessionProgress(searchSessionId, globalProgress);
                if (progressCallback) {
                  progressCallback(globalProgress);
                }
              },
              logCallback,
            );

          // Verifica se foi cancelado DURANTE o processamento do lote
          if (resultadosBatch.length < currentBatch.length) {
            this.logger.log(
              `[OTIMIZADO] Lote ${batchNumber} CANCELADO (processados ${resultadosBatch.length}/${currentBatch.length})`,
            );
            cancelled = true;

            // Ainda assim salva o que foi processado
            if (resultadosBatch.length > 0) {
              todosResultados.push(...resultadosBatch);
              processedCount += resultadosBatch.length;
            }
            break;
          }

          // Acumula resultados do lote
          todosResultados.push(...resultadosBatch);
          processedCount += resultadosBatch.length;

          this.logger.log(
            `[OTIMIZADO] Lote ${batchNumber} CONCLUÍDO | Total processado: ${processedCount}/${totalCnpjs}`,
          );

          // 💾 SALVA RESULTADOS DESTE LOTE IMEDIATAMENTE (libera memória)
          const resultadosComEmail = resultadosBatch.filter((r) => r.email);
          if (resultadosComEmail.length > 0) {
            this.logger.log(
              `[OTIMIZADO] Salvando ${resultadosComEmail.length} emails do lote ${batchNumber}`,
            );

            // Usa função otimizada de salvamento em lotes
            await this.updateEmailInBatches(resultadosComEmail);

            // Marca CNPJs processados como pesquisados
            const cnpjsProcessados = new Set(
              resultadosBatch.map((r) => r.cnpj.replace(/[^\d]/g, '')),
            );
            await this.markAsSearchedInBatches(devedores, cnpjsProcessados);
          }

          // ⏱️ Delay opcional entre lotes (para não sobrecarregar APIs)
          if (this.BATCH_DELAY_MS > 0 && batchIndex < cnpjBatches.length - 1) {
            await this.delay(this.BATCH_DELAY_MS);
          }
        } catch (error) {
          this.logger.error(`[OTIMIZADO] Erro no lote ${batchNumber}:`, error);
          // Continua com próximo lote mesmo em caso de erro
          continue;
        }
      }

      // 6️⃣ Combina resultados finais
      const devedoresComEmail = this.combinarDevedoresComEmails(
        devedores,
        todosResultados,
      );

      // 7️⃣ Gera estatísticas
      const estatisticas =
        this.emailLookupService.gerarEstatisticas(todosResultados);

      this.logger.log(
        `[OTIMIZADO] RESUMO - Total: ${estatisticas.total}, Encontrados: ${estatisticas.encontrados}, Cancelado: ${cancelled}`,
      );

      return {
        sessionId: searchSessionId,
        emails: devedoresComEmail,
        emailsAtualizados: [], // Já foram salvos incrementalmente
        estatisticas,
        cancelled,
      };
    } catch (error) {
      this.logger.error(
        `[OTIMIZADO] Erro na busca de emails (sessão: ${searchSessionId}):`,
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
