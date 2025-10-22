import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EmailResult as EmailLookupResult } from '@app/common/interfaces/email.interface';

// Interface para resposta da API OpenCNPJ
interface OpenCNPJResponse {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  situacao_cadastral?: string;
  telefones?: Array<{
    ddd: string;
    numero: string;
    is_fax: boolean;
  }>;
  // ... outros campos conforme necessário
}

// Interface para callback de progresso
export interface SearchProgress {
  currentBatch: number;
  totalBatches: number;
  currentCnpj: string;
  processedCount: number;
  totalCount: number;
  message: string;
  timestamp: Date;
  devedorId?: number;
}

// Interface para logs em tempo real
export interface LogMessage {
  level: 'log' | 'warn' | 'error';
  message: string;
  cnpj?: string;
  timestamp: Date;
  fonte?: string;
  email?: string;
}

// Exception customizada para cancelamento
export class SearchCancelledException extends Error {
  constructor() {
    super('Busca cancelada pelo usuário');
    this.name = 'SearchCancelledException';
  }
}

// Classe auxiliar para resultado parcial com fonte
class EmailLookupResultPartial {
  cnpj: string;
  email: string | null;
  fonte: string | null;
  sourceName: string;
  error: any;
}

// Configuração para APIs adicionais (estrutura modular)
interface ApiConfig {
  name: string;
  fetchMethod: (
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ) => Promise<EmailLookupResultPartial>;
}

@Injectable()
export class EmailLookupService {
  private readonly logger = new Logger(EmailLookupService.name);

  // CONFIGURAÇÕES OTIMIZADAS PARA OPENCNPJ
  // OpenCNPJ: 50 req/s (3000/min) - usaremos 40 req/s para margem de segurança
  private readonly BATCH_SIZE = 40; // 40 CNPJs por lote (40 req/s)
  private readonly DELAY_BETWEEN_BATCHES = 2000; // 2 segundo entre lotes
  private readonly LOG_THROTTLE_DELAY = 50; // 50ms entre logs para não sobrecarregar UI
  private readonly RETRY_429_DELAY = 10000; // 10 segundos de espera ao receber 429
  private readonly MAX_RETRIES_429 = 3; // Máximo de tentativas em caso de 429
  private readonly REQUEST_TIMEOUT = 30000; // 30 segundos de timeout por requisição

  // Fila de logs para throttling
  private logQueue: Array<() => void> = [];
  private isProcessingLogs = false;

  constructor(private readonly httpService: HttpService) {}

  // Lista de APIs disponíveis (facilita adicionar novas APIs)
  private getAvailableApis(): ApiConfig[] {
    return [
      {
        name: 'OpenCNPJ',
        fetchMethod: (cnpj, logCallback) =>
          this.buscaOpenCNPJ(cnpj, logCallback),
      },
      // ADICIONE NOVAS APIs AQUI SEGUINDO O MESMO PADRÃO:
      // {
      //   name: 'NovaAPI',
      //   fetchMethod: (cnpj, logCallback) => this.buscaNovaAPI(cnpj, logCallback),
      // },
    ];
  }

  // Método auxiliar para enviar logs com throttling
  private sendLog(
    logCallback: (log: LogMessage) => void,
    level: 'log' | 'warn' | 'error',
    message: string,
    cnpj?: string,
    fonte?: string,
    email?: string,
  ) {
    this.logger[level](message);

    if (logCallback) {
      // Adiciona log na fila com throttling
      this.logQueue.push(() => {
        logCallback({
          level,
          message,
          cnpj,
          timestamp: new Date(),
          fonte,
          email,
        });
      });

      // Inicia processamento da fila se não estiver processando
      if (!this.isProcessingLogs) {
        this.processLogQueue();
      }
    }
  }

  // Processa fila de logs com delay para não sobrecarregar UI
  private async processLogQueue() {
    this.isProcessingLogs = true;

    while (this.logQueue.length > 0) {
      const logFn = this.logQueue.shift();
      if (logFn) {
        logFn();
        // Pequeno delay para não enviar todos os logs de uma vez
        await this.delay(this.LOG_THROTTLE_DELAY);
      }
    }

    this.isProcessingLogs = false;
  }

  // Delay simples
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async buscarEmailsPorCNPJs(
    cnpjs: string[],
    cancellationToken?: () => boolean,
    progressCallback?: (progress: SearchProgress) => void,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResult[]> {
    const resultados: EmailLookupResult[] = [];
    const totalBatches = Math.ceil(cnpjs.length / this.BATCH_SIZE);

    this.sendLog(
      logCallback,
      'log',
      `🚀 Iniciando busca de emails para ${cnpjs.length} CNPJs em ${totalBatches} lotes (${this.BATCH_SIZE} CNPJs/lote)`,
    );

    try {
      for (let i = 0; i < cnpjs.length; i += this.BATCH_SIZE) {
        // Verifica cancelamento
        if (cancellationToken && cancellationToken()) {
          this.sendLog(
            logCallback,
            'log',
            `⚠️ Busca cancelada. Retornando ${resultados.length} resultados já processados`,
          );
          return resultados;
        }

        const lote = cnpjs.slice(i, i + this.BATCH_SIZE);
        const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

        this.sendLog(
          logCallback,
          'log',
          `📦 Lote ${currentBatch}/${totalBatches}: Processando ${lote.length} CNPJs em paralelo...`,
        );

        if (progressCallback) {
          progressCallback({
            currentBatch,
            totalBatches,
            currentCnpj: '',
            processedCount: i,
            totalCount: cnpjs.length,
            message: `Processando lote ${currentBatch} de ${totalBatches}`,
            timestamp: new Date(),
          });
        }

        // PROCESSAMENTO PARALELO DO LOTE INTEIRO
        const promises = lote.map(async (cnpj) => {
          // Verifica cancelamento antes de cada CNPJ
          if (cancellationToken && cancellationToken()) {
            throw new SearchCancelledException();
          }

          try {
            const resultado = await this.buscarEmailPorCNPJonExternalApi(
              cnpj,
              cancellationToken,
              logCallback,
            );

            if (resultado.email) {
              this.sendLog(
                logCallback,
                'log',
                `✅ ${cnpj}: ${resultado.email}`,
                cnpj,
                resultado.fonte,
                resultado.email,
              );
            } else {
              this.sendLog(
                logCallback,
                'log',
                `❌ ${cnpj}: Nenhum email encontrado`,
                cnpj,
              );
            }

            return resultado;
          } catch (error) {
            if (error instanceof SearchCancelledException) {
              throw error;
            }

            this.sendLog(
              logCallback,
              'error',
              `⚠️ Erro ao buscar ${cnpj}: ${error.message}`,
              cnpj,
            );

            return {
              cnpj,
              email: null,
            };
          }
        });

        try {
          // Aguarda todas as requisições do lote em paralelo
          const resultadosLote = await Promise.all(promises);
          resultados.push(...resultadosLote);

          const emailsEncontrados = resultadosLote.filter(
            (r) => r.email,
          ).length;
          this.sendLog(
            logCallback,
            'log',
            `✓ Lote ${currentBatch} concluído: ${emailsEncontrados}/${lote.length} emails encontrados`,
          );

          if (progressCallback) {
            progressCallback({
              currentBatch,
              totalBatches,
              currentCnpj: '',
              processedCount: resultados.length,
              totalCount: cnpjs.length,
              message: `Lote ${currentBatch} concluído: ${emailsEncontrados}/${lote.length} emails`,
              timestamp: new Date(),
            });
          }
        } catch (error) {
          if (error instanceof SearchCancelledException) {
            this.sendLog(
              logCallback,
              'log',
              `⚠️ Busca cancelada. Retornando ${resultados.length} resultados já processados`,
            );
            return resultados;
          }
          throw error;
        }

        // Aguarda apenas se não for o último lote
        if (i + this.BATCH_SIZE < cnpjs.length) {
          const delaySeconds = this.DELAY_BETWEEN_BATCHES / 1000;
          this.sendLog(
            logCallback,
            'log',
            `⏳ Aguardando ${delaySeconds}s antes do próximo lote...`,
          );

          if (progressCallback) {
            progressCallback({
              currentBatch,
              totalBatches,
              currentCnpj: '',
              processedCount: resultados.length,
              totalCount: cnpjs.length,
              message: `Aguardando ${delaySeconds}s antes do próximo lote...`,
              timestamp: new Date(),
            });
          }

          const delayCancelado = await this.delayWithCancellation(
            this.DELAY_BETWEEN_BATCHES,
            cancellationToken,
          );

          if (delayCancelado) {
            this.sendLog(
              logCallback,
              'log',
              `⚠️ Busca cancelada durante delay. Retornando ${resultados.length} resultados já processados`,
            );
            return resultados;
          }
        }
      }

      const emailsEncontrados = resultados.filter((r) => r.email).length;
      this.sendLog(
        logCallback,
        'log',
        `🎉 Busca finalizada! ${emailsEncontrados}/${resultados.length} emails encontrados`,
      );

      return resultados;
    } catch (error) {
      this.sendLog(
        logCallback,
        'error',
        `❌ Erro inesperado: ${error.message}. Retornando ${resultados.length} resultados já processados`,
      );
      return resultados;
    }
  }

  // MÉTODO PRINCIPAL: Busca nas APIs disponíveis (modular)
  private async buscarEmailPorCNPJonExternalApi(
    cnpj: string,
    cancellationToken?: () => boolean,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResult> {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    if (cancellationToken && cancellationToken()) {
      throw new SearchCancelledException();
    }

    const apis = this.getAvailableApis();

    // Cria promises para todas as APIs configuradas
    const promises = apis.map((api) => api.fetchMethod(cnpjLimpo, logCallback));

    // Executa todas em paralelo
    const results = await Promise.all(promises);

    // Busca o primeiro resultado válido
    const foundResult = results.find((r) => r.email !== null);

    if (foundResult) {
      return {
        cnpj,
        email: foundResult.email,
        fonte: foundResult.sourceName,
      };
    }

    return {
      cnpj,
      email: null,
    };
  }

  // Delay com verificação de cancelamento
  private async delayWithCancellation(
    ms: number,
    cancellationToken?: () => boolean,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 100; // Verifica a cada 100ms

      const intervalId = setInterval(() => {
        if (cancellationToken && cancellationToken()) {
          clearInterval(intervalId);
          resolve(true); // Cancelado
          return;
        }

        if (Date.now() - startTime >= ms) {
          clearInterval(intervalId);
          resolve(false); // Completou normalmente
        }
      }, checkInterval);
    });
  }

  // ========================================
  // MÉTODOS DE BUSCA POR API (MODULARES)
  // ========================================

  // OpenCNPJ - API Principal (chamada HTTP direta)
  private async buscaOpenCNPJ(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'OpenCNPJ';
    let retryCount = 0;

    while (retryCount <= this.MAX_RETRIES_429) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<OpenCNPJResponse>(
            `https://api.opencnpj.org/${cnpj}`,
            {
              timeout: this.REQUEST_TIMEOUT,
              headers: {
                Accept: 'application/json',
              },
            },
          ),
        );

        if (response.data?.email) {
          return {
            cnpj,
            email: response.data.email,
            fonte: sourceName,
            sourceName,
            error: null,
          };
        }

        return {
          cnpj,
          email: null,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      } catch (error) {
        // Tratamento específico para 429 (Rate Limit)
        if (error.response?.status === 429) {
          retryCount++;

          if (retryCount <= this.MAX_RETRIES_429) {
            this.sendLog(
              logCallback,
              'warn',
              `⚠️ Rate limit atingido (429) para CNPJ ${cnpj}. Tentativa ${retryCount}/${this.MAX_RETRIES_429}. Aguardando ${this.RETRY_429_DELAY}ms...`,
              cnpj,
              sourceName,
            );

            await this.delay(this.RETRY_429_DELAY);
            continue; // Tenta novamente
          }
        }

        // Tratamento para 404 (CNPJ não encontrado)
        if (error.response?.status === 404) {
          return {
            cnpj,
            email: null,
            fonte: sourceName,
            sourceName,
            error: null,
          };
        }

        // Outros erros ou excedeu tentativas
        this.sendLog(
          logCallback,
          'warn',
          `Erro na ${sourceName} para CNPJ ${cnpj}: ${error.message}`,
          cnpj,
          sourceName,
        );

        return {
          cnpj,
          email: null,
          fonte: sourceName,
          sourceName,
          error: error,
        };
      }
    }

    return {
      cnpj,
      email: null,
      fonte: sourceName,
      sourceName,
      error: new Error('Max retries exceeded'),
    };
  }

  // ========================================
  // TEMPLATE PARA ADICIONAR NOVAS APIs
  // ========================================

  // Exemplo: ReceitaWS (mantido como exemplo)
  private async buscaReceitaWS(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'ReceitaWS';
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
          timeout: this.REQUEST_TIMEOUT,
        }),
      );

      if (response.data?.status === 'OK' && response.data?.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      return { cnpj, email: null, fonte: sourceName, sourceName, error: null };
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na ${sourceName} para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        sourceName,
      );
      return { cnpj, email: null, fonte: sourceName, sourceName, error: error };
    }
  }

  // Exemplo: BrasilAPI (mantido como exemplo)
  private async buscaBrasilAPI(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'BrasilAPI';
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
          {
            timeout: this.REQUEST_TIMEOUT,
          },
        ),
      );

      if (response.data?.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      return { cnpj, email: null, fonte: sourceName, sourceName, error: null };
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na ${sourceName} para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        sourceName,
      );
      return { cnpj, email: null, fonte: sourceName, sourceName, error: error };
    }
  }

  // Exemplo: CNPJWS (mantido como exemplo)
  private async buscaCnpjWs(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'CNPJWS';
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
          timeout: this.REQUEST_TIMEOUT,
        }),
      );

      if (response.data?.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      return { cnpj, email: null, fonte: sourceName, sourceName, error: null };
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na ${sourceName} para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        sourceName,
      );
      return { cnpj, email: null, fonte: sourceName, sourceName, error: error };
    }
  }

  /*
  // Template para adicionar nova API
  private async buscaMinhaNovaAPI(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'MinhaNovaAPI';
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>(
          `https://api.exemplo.com/${cnpj}`,
          {
            timeout: this.REQUEST_TIMEOUT,
            headers: {
              'Accept': 'application/json',
              // 'Authorization': 'Bearer TOKEN' // se necessário
            },
          }
        ),
      );

      if (response.data?.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      return { cnpj, email: null, fonte: sourceName, sourceName, error: null };
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na ${sourceName} para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        sourceName,
      );
      return { cnpj, email: null, fonte: sourceName, sourceName, error: error };
    }
  }
  */

  // Método para gerar estatísticas
  gerarEstatisticas(resultados: EmailLookupResult[]) {
    const total = resultados.length;
    const encontrados = resultados.filter((r) => r.email).length;
    const naoEncontrados = total - encontrados;
    const taxaSucesso =
      total > 0 ? `${Math.round((encontrados / total) * 100)}%` : '0%';

    const porFonte: { [key: string]: number } = {};
    resultados.forEach((r) => {
      if (r.fonte) {
        porFonte[r.fonte] = (porFonte[r.fonte] || 0) + 1;
      }
    });

    return {
      total,
      encontrados,
      naoEncontrados,
      taxaSucesso,
      porFonte,
    };
  }
}
