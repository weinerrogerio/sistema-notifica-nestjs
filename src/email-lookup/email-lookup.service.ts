import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BrasilAPIResponse,
  CnpjWsRresponse,
  ReceitaWSResponse,
} from '@app/common/interfaces/email.interface';
import { EmailResult as EmailLookupResult } from '@app/common/interfaces/email.interface';

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

// OTIMIZAÇÃO: Esta classe auxilia a retornar a fonte junto com o resultado.
class EmailLookupResultPartial {
  cnpj: string;
  email: string | null;
  fonte: string | null;
  sourceName: string; // Para identificar a fonte na promise
  error: any;
}

@Injectable()
export class EmailLookupService {
  private readonly logger = new Logger(EmailLookupService.name);

  // Configurações de delay (em segundos) - MANTIDOS E OTIMIZADOS
  // 65 segundos garante que o lote de 3 requisições por API resete o limite de 3/min (60s + 5s de margem).
  private readonly DELAY_BETWEEN_BATCHES = 65;
  private readonly BATCH_SIZE = 3; // Processa 3 CNPJs por vez, saturando o limite de 3/min por API.

  constructor(private readonly httpService: HttpService) {}

  // Método auxiliar para enviar logs em tempo real
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
      logCallback({
        level,
        message,
        cnpj,
        timestamp: new Date(),
        fonte,
        email,
      });
    }
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
      `Iniciando busca de emails para ${cnpjs.length} CNPJs em ${totalBatches} lotes`,
    );

    try {
      for (let i = 0; i < cnpjs.length; i += this.BATCH_SIZE) {
        // Verifica cancelamento
        if (cancellationToken && cancellationToken()) {
          this.sendLog(
            logCallback,
            'log',
            `Busca cancelada. Retornando ${resultados.length} resultados já processados`,
          );
          return resultados;
        }

        const lote = cnpjs.slice(i, i + this.BATCH_SIZE);
        const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

        this.sendLog(
          // Log de início do lote (MANTIDO)
          logCallback,
          'log',
          `Processando lote ${currentBatch}: CNPJs ${i + 1} a ${Math.min(i + this.BATCH_SIZE, cnpjs.length)} de ${cnpjs.length}`,
        );

        // Progress Callback de início de lote (MANTIDO)
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

        // --- INÍCIO: Processamento dos CNPJs dentro do Lote (SEQUENCIAL para logs/progresso) ---
        for (const cnpj of lote) {
          // Verifica cancelamento antes de cada CNPJ
          if (cancellationToken && cancellationToken()) {
            this.sendLog(
              logCallback,
              'log',
              `Busca cancelada. Retornando ${resultados.length} resultados já processados`,
            );
            return resultados;
          }

          if (progressCallback) {
            progressCallback({
              currentBatch,
              totalBatches,
              currentCnpj: cnpj,
              processedCount: resultados.length,
              totalCount: cnpjs.length,
              message: `Buscando email para CNPJ: ${cnpj}`,
              timestamp: new Date(),
            });
          }

          this.sendLog(
            logCallback,
            'log',
            `Buscando email para CNPJ: ${cnpj}`,
            cnpj,
          );

          try {
            // OTIMIZAÇÃO: Chamada que fará a busca nas 3 APIs em paralelo
            const resultado = await this.buscarEmailPorCNPJonExternalApi(
              cnpj,
              cancellationToken,
              logCallback,
            );
            resultados.push(resultado);

            if (resultado.email) {
              this.sendLog(
                logCallback,
                'log',
                `Email encontrado para CNPJ ${cnpj}: ${resultado.email}`,
                cnpj,
                resultado.fonte,
                resultado.email,
              );
            } else {
              this.sendLog(
                logCallback,
                'log',
                `Nenhum email encontrado para CNPJ ${cnpj}`,
                cnpj,
              );
            }

            if (progressCallback) {
              const message = resultado.email
                ? `Email encontrado para ${cnpj}: ${resultado.email} (${resultado.fonte})`
                : `Nenhum email encontrado para ${cnpj}`;

              progressCallback({
                currentBatch,
                totalBatches,
                currentCnpj: cnpj,
                processedCount: resultados.length,
                totalCount: cnpjs.length,
                message,
                timestamp: new Date(),
              });
            }
          } catch (error) {
            // Se foi cancelado dentro da busca da API, retorna resultados parciais
            if (error instanceof SearchCancelledException) {
              this.sendLog(
                logCallback,
                'log',
                `Busca cancelada durante consulta do CNPJ ${cnpj}. Retornando ${resultados.length} resultados já processados`,
              );
              return resultados;
            }

            this.sendLog(
              logCallback,
              'error',
              `Erro ao buscar email para CNPJ ${cnpj}: ${error.message}`,
              cnpj,
            );

            resultados.push({
              cnpj,
              email: null,
            });

            if (progressCallback) {
              progressCallback({
                currentBatch,
                totalBatches,
                currentCnpj: cnpj,
                processedCount: resultados.length,
                totalCount: cnpjs.length,
                message: `Erro ao buscar email para CNPJ ${cnpj}: ${error.message}`,
                timestamp: new Date(),
              });
            }
          }
        }
        // --- FIM: Processamento dos CNPJs dentro do Lote ---

        // Aguarda apenas se não for o último lote
        if (i + this.BATCH_SIZE < cnpjs.length) {
          this.sendLog(
            logCallback,
            'log',
            `Aguardando ${this.DELAY_BETWEEN_BATCHES}s antes do próximo lote...`,
          );

          if (progressCallback) {
            progressCallback({
              currentBatch,
              totalBatches,
              currentCnpj: '',
              processedCount: resultados.length,
              totalCount: cnpjs.length,
              message: `Aguardando ${this.DELAY_BETWEEN_BATCHES}s antes do próximo lote...`,
              timestamp: new Date(),
            });
          }

          // Delay com verificação de cancelamento
          const delayCancelado = await this.delayWithCancellation(
            this.DELAY_BETWEEN_BATCHES * 1000,
            cancellationToken,
          );

          // Se delay foi cancelado, retorna resultados parciais
          if (delayCancelado) {
            this.sendLog(
              logCallback,
              'log',
              `Busca cancelada durante delay. Retornando ${resultados.length} resultados já processados`,
            );
            return resultados;
          }
        }
      }

      this.sendLog(
        logCallback,
        'log',
        `Busca finalizada. ${resultados.filter((r) => r.email).length} emails encontrados de ${resultados.length} CNPJs processados`,
      );

      return resultados;
    } catch (error) {
      // Se qualquer erro inesperado, retorna o que já foi processado
      this.sendLog(
        logCallback,
        'error',
        `Erro inesperado na busca: ${error.message}. Retornando ${resultados.length} resultados já processados`,
      );
      return resultados;
    }
  }

  // MÉTODO PRINCIPAL OTIMIZADO: Busca as 3 APIs em paralelo
  private async buscarEmailPorCNPJonExternalApi(
    cnpj: string,
    cancellationToken?: () => boolean,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResult> {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    // Verifica cancelamento antes das tentativas
    if (cancellationToken && cancellationToken()) {
      throw new SearchCancelledException();
    }

    // OTIMIZAÇÃO: Cria e dispara as 3 requisições em paralelo.
    const promises = [
      this.buscaReceitaWS(cnpjLimpo, logCallback),
      this.buscaBrasilAPI(cnpjLimpo, logCallback),
      this.buscaCnpjWs(cnpjLimpo, logCallback),
    ];

    // Espera que todas as requisições paralelas terminem.
    const results = await Promise.all(promises);

    // OTIMIZAÇÃO: Busca o primeiro resultado válido
    const foundResult = results.find((r) => r.email !== null);

    if (foundResult) {
      // Envia log do resultado encontrado por alguma das APIs
      this.sendLog(
        logCallback,
        'log',
        `Email encontrado em ${foundResult.sourceName} para CNPJ ${cnpj}`,
        cnpj,
        foundResult.sourceName,
        foundResult.email,
      );

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

  // O delay de cancelamento foi mantido.
  private async delayWithCancellation(
    ms: number,
    cancellationToken?: () => boolean,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 1000;

      const intervalId = setInterval(() => {
        if (cancellationToken && cancellationToken()) {
          clearInterval(intervalId);
          resolve(true); // Retorna true = foi cancelado
          return;
        }

        if (Date.now() - startTime >= ms) {
          clearInterval(intervalId);
          resolve(false); // Retorna false = completou normalmente
        }
      }, checkInterval);
    });
  }

  // OTIMIZAÇÃO: Métodos de busca de API retornam um objeto parcial para identificar a fonte.

  private async buscaReceitaWS(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'ReceitaWS';
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );

      const response = await firstValueFrom(
        this.httpService.get<ReceitaWSResponse>(
          `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        ),
      );

      if (response.data.status === 'OK' && response.data.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );
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

  private async buscaBrasilAPI(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'BrasilAPI';
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );

      const response = await firstValueFrom(
        this.httpService.get<BrasilAPIResponse>(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        ),
      );

      if (response.data.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );
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

  private async buscaCnpjWs(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResultPartial> {
    const sourceName = 'CNPJWS';
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );

      const response = await firstValueFrom(
        this.httpService.get<CnpjWsRresponse>(
          `https://publica.cnpj.ws/cnpj/${cnpj}`,
        ),
      );

      if (response.data.email) {
        return {
          cnpj,
          email: response.data.email,
          fonte: sourceName,
          sourceName,
          error: null,
        };
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na ${sourceName} para CNPJ: ${cnpj}`,
        cnpj,
        sourceName,
      );
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

  // Método para gerar estatísticas (você deve ter este método)
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
