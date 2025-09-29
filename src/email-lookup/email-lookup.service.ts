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

@Injectable()
export class EmailLookupService {
  private readonly logger = new Logger(EmailLookupService.name);

  // Configurações de delay (em segundos)
  private readonly DELAY_BETWEEN_BATCHES = 65; // 65 segundos entre lotes de 3 CNPJs
  private readonly BATCH_SIZE = 3; // Processa 3 CNPJs por vez

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
    // Envia via logger normal
    this.logger[level](message);

    // Envia via callback para SSE
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
    logCallback?: (log: LogMessage) => void, // Novo callback para logs
  ): Promise<EmailLookupResult[]> {
    const resultados: EmailLookupResult[] = [];
    const totalBatches = Math.ceil(cnpjs.length / this.BATCH_SIZE);

    this.sendLog(
      logCallback,
      'log',
      `Iniciando busca de emails para ${cnpjs.length} CNPJs em ${totalBatches} lotes`,
    );

    // Processa em lotes de 3 CNPJs
    for (let i = 0; i < cnpjs.length; i += this.BATCH_SIZE) {
      // Verifica se foi cancelado
      if (cancellationToken && cancellationToken()) {
        this.sendLog(logCallback, 'log', 'Busca cancelada pelo usuário');
        throw new SearchCancelledException();
      }

      const lote = cnpjs.slice(i, i + this.BATCH_SIZE);
      const currentBatch = Math.floor(i / this.BATCH_SIZE) + 1;

      this.sendLog(
        logCallback,
        'log',
        `Processando lote ${currentBatch}: CNPJs ${i + 1} a ${Math.min(i + this.BATCH_SIZE, cnpjs.length)} de ${cnpjs.length}`,
      );

      // Callback de progresso - início do lote
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

      // Processa o lote atual
      for (const cnpj of lote) {
        // Verifica cancelamento novamente
        if (cancellationToken && cancellationToken()) {
          this.sendLog(logCallback, 'log', 'Busca cancelada pelo usuário');
          throw new SearchCancelledException();
        }

        // Callback de progresso - CNPJ atual
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
          const resultado = await this.buscarEmailPorCNPJonExternalApi(
            cnpj,
            cancellationToken,
            logCallback, // Passa o callback para os métodos internos
          );
          resultados.push(resultado);

          // Log do resultado
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

          // Callback de progresso - resultado encontrado
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
          if (error instanceof SearchCancelledException) {
            throw error; // Re-propaga o erro de cancelamento
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

          // Callback de progresso - erro
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

      // Aguarda apenas se não for o último lote
      if (i + this.BATCH_SIZE < cnpjs.length) {
        this.sendLog(
          logCallback,
          'log',
          `Aguardando ${this.DELAY_BETWEEN_BATCHES}s antes do próximo lote...`,
        );

        // Callback de progresso - delay
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
        await this.delayWithCancellation(
          this.DELAY_BETWEEN_BATCHES * 1000,
          cancellationToken,
        );
      }
    }

    this.sendLog(
      logCallback,
      'log',
      `Busca finalizada. ${resultados.filter((r) => r.email).length} emails encontrados de ${resultados.length} CNPJs processados`,
    );

    return resultados;
  }

  private async buscarEmailPorCNPJonExternalApi(
    cnpj: string,
    cancellationToken?: () => boolean,
    logCallback?: (log: LogMessage) => void,
  ): Promise<EmailLookupResult> {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    // Verifica cancelamento antes de cada tentativa
    if (cancellationToken && cancellationToken()) {
      throw new SearchCancelledException();
    }

    // Tentar ReceitaWS primeiro
    const emailReceitaWS = await this.buscaReceitaWS(cnpjLimpo, logCallback);
    if (emailReceitaWS) {
      return {
        cnpj,
        email: emailReceitaWS,
        fonte: 'ReceitaWS',
      };
    }

    // Verifica cancelamento
    if (cancellationToken && cancellationToken()) {
      throw new SearchCancelledException();
    }

    // Se não encontrou, tentar BrasilAPI
    const emailBrasilAPI = await this.buscaBrasilAPI(cnpjLimpo, logCallback);
    if (emailBrasilAPI) {
      return {
        cnpj,
        email: emailBrasilAPI,
        fonte: 'BrasilAPI',
      };
    }

    // Verifica cancelamento
    if (cancellationToken && cancellationToken()) {
      throw new SearchCancelledException();
    }

    // Se não encontrou, tentar CNPJWS
    const emailCnpjWS = await this.buscaCnpjWs(cnpjLimpo, logCallback);
    if (emailCnpjWS) {
      return {
        cnpj,
        email: emailCnpjWS,
        fonte: 'CNPJWS',
      };
    }

    return {
      cnpj,
      email: null,
    };
  }

  private async delayWithCancellation(
    ms: number,
    cancellationToken?: () => boolean,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = 1000; // Verifica cancelamento a cada 1 segundo

      const intervalId = setInterval(() => {
        if (cancellationToken && cancellationToken()) {
          clearInterval(intervalId);
          reject(new SearchCancelledException());
          return;
        }

        if (Date.now() - startTime >= ms) {
          clearInterval(intervalId);
          resolve();
        }
      }, checkInterval);
    });
  }

  private async buscaReceitaWS(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<string | null> {
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando ReceitaWS para CNPJ: ${cnpj}`,
        cnpj,
        'ReceitaWS',
      );

      const response = await firstValueFrom(
        this.httpService.get<ReceitaWSResponse>(
          `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        ),
      );

      if (response.data.status === 'OK' && response.data.email) {
        this.sendLog(
          logCallback,
          'log',
          `Email encontrado na ReceitaWS para CNPJ ${cnpj}: ${response.data.email}`,
          cnpj,
          'ReceitaWS',
          response.data.email,
        );
        return response.data.email;
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na ReceitaWS para CNPJ: ${cnpj}`,
        cnpj,
        'ReceitaWS',
      );
      return null;
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na ReceitaWS para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        'ReceitaWS',
      );
      return null;
    }
  }

  private async buscaBrasilAPI(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<string | null> {
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando BrasilAPI para CNPJ: ${cnpj}`,
        cnpj,
        'BrasilAPI',
      );

      const response = await firstValueFrom(
        this.httpService.get<BrasilAPIResponse>(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        ),
      );

      if (response.data.email) {
        this.sendLog(
          logCallback,
          'log',
          `Email encontrado na BrasilAPI para CNPJ ${cnpj}: ${response.data.email}`,
          cnpj,
          'BrasilAPI',
          response.data.email,
        );
        return response.data.email;
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na BrasilAPI para CNPJ: ${cnpj}`,
        cnpj,
        'BrasilAPI',
      );
      return null;
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na BrasilAPI para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        'BrasilAPI',
      );
      return null;
    }
  }

  private async buscaCnpjWs(
    cnpj: string,
    logCallback?: (log: LogMessage) => void,
  ): Promise<string | null> {
    try {
      this.sendLog(
        logCallback,
        'log',
        `Tentando CNPJWS para CNPJ: ${cnpj}`,
        cnpj,
        'CNPJWS',
      );

      const response = await firstValueFrom(
        this.httpService.get<CnpjWsRresponse>(
          `https://publica.cnpj.ws/cnpj/${cnpj}`,
        ),
      );

      if (response.data.email) {
        this.sendLog(
          logCallback,
          'log',
          `Email encontrado na CNPJWS para CNPJ ${cnpj}: ${response.data.email}`,
          cnpj,
          'CNPJWS',
          response.data.email,
        );
        return response.data.email;
      }

      this.sendLog(
        logCallback,
        'log',
        `Nenhum email encontrado na CNPJWS para CNPJ: ${cnpj}`,
        cnpj,
        'CNPJWS',
      );
      return null;
    } catch (error) {
      this.sendLog(
        logCallback,
        'warn',
        `Erro na CNPJWS para CNPJ ${cnpj}: ${error.message}`,
        cnpj,
        'CNPJWS',
      );
      return null;
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
