import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BrasilAPIResponse,
  CnpjWsRresponse,
  ReceitaWSResponse,
} from '@app/common/interfaces/email.interface';
import { EmailResult as EmailLookupResult } from '@app/common/interfaces/email.interface';

@Injectable()
export class EmailLookupService {
  private readonly logger = new Logger(EmailLookupService.name);

  // Configurações de delay (em segundos)
  private readonly DELAY_BETWEEN_BATCHES = 65; // 65 segundos entre lotes de 3 CNPJs
  private readonly BATCH_SIZE = 3; // Processa 3 CNPJs por vez

  constructor(private readonly httpService: HttpService) {}

  async buscarEmailsPorCNPJs(cnpjs: string[]): Promise<EmailLookupResult[]> {
    const resultados: EmailLookupResult[] = [];

    // Processa em lotes de 3 CNPJs
    for (let i = 0; i < cnpjs.length; i += this.BATCH_SIZE) {
      const lote = cnpjs.slice(i, i + this.BATCH_SIZE);

      this.logger.log(
        `Processando lote ${Math.floor(i / this.BATCH_SIZE) + 1}: CNPJs ${i + 1} a ${Math.min(i + this.BATCH_SIZE, cnpjs.length)} de ${cnpjs.length}`,
      );

      // Processa o lote atual
      for (const cnpj of lote) {
        this.logger.log(`Buscando email para CNPJ: ${cnpj}`);

        try {
          const resultado = await this.buscarEmailPorCNPJ(cnpj);
          resultados.push(resultado);
        } catch (error) {
          this.logger.error(`Erro ao buscar email para CNPJ ${cnpj}:`, error);
          resultados.push({
            cnpj,
            email: null,
          });
        }
      }

      // Aguarda apenas se não for o último lote
      if (i + this.BATCH_SIZE < cnpjs.length) {
        this.logger.log(
          `Aguardando ${this.DELAY_BETWEEN_BATCHES}s antes do próximo lote...`,
        );
        await this.delay(this.DELAY_BETWEEN_BATCHES * 1000);
      }
    }

    return resultados;
  }

  private async buscarEmailPorCNPJ(cnpj: string): Promise<EmailLookupResult> {
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    // Tentar ReceitaWS primeiro
    const emailReceitaWS = await this.buscaReceitaWS(cnpjLimpo);
    if (emailReceitaWS) {
      return {
        cnpj,
        email: emailReceitaWS,
        fonte: 'ReceitaWS',
      };
    }

    // Se não encontrou, tentar BrasilAPI
    const emailBrasilAPI = await this.buscaBrasilAPI(cnpjLimpo);
    if (emailBrasilAPI) {
      return {
        cnpj,
        email: emailBrasilAPI,
        fonte: 'BrasilAPI',
      };
    }

    // Se não encontrou, tentar CNPJWS
    const emailCnpjWS = await this.buscaCnpjWs(cnpjLimpo);
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

  private async buscaReceitaWS(cnpj: string): Promise<string | null> {
    try {
      this.logger.log(`Tentando ReceitaWS para CNPJ: ${cnpj}`);

      const response = await firstValueFrom(
        this.httpService.get<ReceitaWSResponse>(
          `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        ),
      );

      if (response.data.status === 'OK' && response.data.email) {
        this.logger.log(`Email encontrado na ReceitaWS para CNPJ ${cnpj}`);
        return response.data.email;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Erro na ReceitaWS para CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  private async buscaBrasilAPI(cnpj: string): Promise<string | null> {
    try {
      this.logger.log(`Tentando BrasilAPI para CNPJ: ${cnpj}`);

      const response = await firstValueFrom(
        this.httpService.get<BrasilAPIResponse>(
          `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
        ),
      );

      if (response.data.email) {
        this.logger.log(`Email encontrado na BrasilAPI para CNPJ ${cnpj}`);
        return response.data.email;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Erro na BrasilAPI para CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  private async buscaCnpjWs(cnpj: string): Promise<string | null> {
    try {
      this.logger.log(`Tentando CNPJWS para CNPJ: ${cnpj}`);

      const response = await firstValueFrom(
        this.httpService.get<CnpjWsRresponse>(
          `https://publica.cnpj.ws/cnpj/${cnpj}`,
        ),
      );

      if (response.data.email) {
        this.logger.log(`Email encontrado na CNPJWS para CNPJ ${cnpj}`);
        return response.data.email;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Erro na CNPJWS para CNPJ ${cnpj}:`, error.message);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Método para calcular tempo estimado de processamento
  calcularTempoEstimado(totalCnpjs: number): string {
    const totalLotes = Math.ceil(totalCnpjs / this.BATCH_SIZE);
    const tempoTotalSegundos = (totalLotes - 1) * this.DELAY_BETWEEN_BATCHES;

    if (tempoTotalSegundos < 60) {
      return `${tempoTotalSegundos} segundos`;
    } else {
      const minutos = Math.floor(tempoTotalSegundos / 60);
      const segundos = tempoTotalSegundos % 60;
      return `${minutos}min ${segundos > 0 ? `${segundos}s` : ''}`;
    }
  }

  gerarEstatisticas(resultados: EmailLookupResult[]) {
    const total = resultados.length;
    const encontrados = resultados.filter((r) => r.email !== null).length;
    const naoEncontrados = total - encontrados;

    const porFonte = resultados.reduce(
      (acc, r) => {
        if (r.fonte) {
          acc[r.fonte] = (acc[r.fonte] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      encontrados,
      naoEncontrados,
      taxaSucesso: `${((encontrados / total) * 100).toFixed(1)}%`,
      porFonte,
      tempoEstimadoProcessamento: this.calcularTempoEstimado(total),
    };
  }
}
