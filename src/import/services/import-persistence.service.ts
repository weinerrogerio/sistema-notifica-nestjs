import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';
import { ImportData } from '@app/common/utils/dataTransform';
import { DocProtestoService } from 'src/doc-protesto/doc-protesto.service';
import { DevedorService } from '@app/devedor/devedor.service';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { CredorService } from '@app/credor/credor.service';
import { ApresentanteService } from '@app/apresentante/apresentante.service';
import { DocProtestoCredorService } from '@app/doc-protesto-credor/doc-protesto-credor.service';
import { DataValidation } from '@app/common/utils/xmlValidation.util';
import { TransformationResult } from '@app/common/utils/dataTransform';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LogArquivoImportService } from '@app/log-arquivo-import/log-arquivo-import.service';
import { AddressValidator, DocumentValidator } from '@app/common';
import { ImportOptionsDto } from '@app/common/interfaces/import-oprions.interface';
import { DuplicateInfo } from '@app/common/interfaces/doc-protesto.interface';

interface CriticalValidationResult {
  isValid: boolean;
  errors: string[];
}

// aqui irá cnonter os create e update de importacao --> receber dados verificado e salvar em user.create , docProtesto.create...
@Injectable()
export class ImportPersistenceService {
  constructor(
    private readonly docProtestoService: DocProtestoService,
    private readonly devedorService: DevedorService,
    private readonly credorService: CredorService,
    private readonly apresentanteService: ApresentanteService,
    private readonly logNotificacaoService: LogNotificacaoService,
    private readonly relacaoProtestoCredorService: DocProtestoCredorService,
    private readonly dataValidation: DataValidation,
    private readonly transformationResult: TransformationResult,
    private readonly logArquivoImportService: LogArquivoImportService,
  ) {}

  // Validação de campos críticos que impedem salvamento
  private validateCriticalFields(data: ImportData): CriticalValidationResult {
    const errors: string[] = [];

    // Campos obrigatórios que impedem salvamento
    const requiredFields = [
      { field: 'protocolo', name: 'Número de distribuição' },
      { field: 'numero_do_titulo', name: 'Número do título' },
      { field: 'valor', name: 'Valor' },
      { field: 'devedor', name: 'Nome do devedor' },
      { field: 'documento', name: 'Documento do devedor' },
      { field: 'data', name: 'Data de apresentação' },
      { field: 'vencimento', name: 'Data de vencimento' },
    ];

    requiredFields.forEach(({ field, name }) => {
      const value = data[field];
      if (!value || String(value).trim() === '') {
        errors.push(`${name} é obrigatório`);
      }
    });

    // Validação de valor numérico
    if (data.valor && !this.isValidNumericValue(data.valor)) {
      errors.push('Valor deve ser um número válido');
    }

    // Validação de saldo numérico (se informado)
    if (data.saldo && !this.isValidNumericValue(data.saldo)) {
      errors.push('Saldo deve ser um número válido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validação de campos com ressalvas (não impedem salvamento)
  private validateWarningFields(data: ImportData): string[] {
    const warnings: string[] = [];

    // Validação de documento do devedor
    if (data.documento && !DocumentValidator.isValidDocument(data.documento)) {
      warnings.push(`Documento do devedor inválido: ${data.documento}`);
    }

    // Validação de documento do sacador
    if (
      data.documento_sacador &&
      !DocumentValidator.isValidDocument(data.documento_sacador)
    ) {
      warnings.push(`Documento do sacador inválido: ${data.documento_sacador}`);
    }

    // Validação de CEP
    if (data.cep && !AddressValidator.isValidCep(data.cep)) {
      warnings.push(`CEP inválido: ${data.cep}`);
    }

    // Validação de UF
    if (data.uf && !AddressValidator.isValidUf(data.uf)) {
      warnings.push(`UF inválida: ${data.uf}`);
    }

    return warnings;
  }

  private isValidNumericValue(value: string | number): boolean {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') {
      const numericValue = parseFloat(
        value.replace(/[^\d.,]/g, '').replace(',', '.'),
      );
      return !isNaN(numericValue);
    }
    return false;
  }

  // Função para busca em lote de duplicidades
  private async checkForDuplicates(data: ImportData[]): Promise<Set<string>> {
    const uniqueKeys = data.map(
      (item) =>
        `${item.protocolo}|${item.cartorio}|${item.numero_do_titulo}|${item.apresentante}|${item.vencimento}`,
    );

    // Buscar todos os registros existentes de uma vez
    const existingRecords =
      await this.docProtestoService.findByUniqueKeys(uniqueKeys);

    // Criar Set com chaves dos registros existentes
    const duplicateKeys = new Set<string>();
    existingRecords.forEach((record) => {
      const key = `${record.num_distribuicao}|${record.cart_protesto}|${record.num_titulo}|${record.apresentante?.nome || record.fk_apresentante}|${record.vencimento}`;
      duplicateKeys.add(key);
    });

    return duplicateKeys;
  }

  // FUNÇÃO RESPONSAVEL POR GUARDAR OS DADOS NO BANCO SO ARQUIVO XML --> CHAMAR ESSA FUNÇAÕ EM STRATEGY XML(xml.strategy.ts)
  async xmlCreate(
    data: ImportData[],
    tokenPayload: TokenPayloadDto,
    logImportId?: number,
    //eslint-disable-next-line
    options: ImportOptionsDto = { allowPartialImport: false },
  ): Promise<{
    processedCount: number;
    errorCount: number;
    skippedCount: number;
    duplicateCount: number;
    errors: string[];
    duplicates: DuplicateInfo[];
  }> {
    console.log('xmlCreate: ', data.length, tokenPayload);
    console.log('xmlCreate -  logImport.id:::::: ', logImportId);

    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    const duplicates: DuplicateInfo[] = [];

    try {
      // Verificar duplicidades em lote antes de processar
      const duplicateKeys = await this.checkForDuplicates(data);

      for (let i = 0; i < data.length; i++) {
        const dado = data[i];
        const recordNumber = i + 1;

        try {
          // 2. Verificar se é duplicado
          const uniqueKey = `${dado.protocolo}|${dado.cartorio}|${dado.numero_do_titulo}|${dado.apresentante}|${dado.vencimento}`;

          if (duplicateKeys.has(uniqueKey)) {
            duplicateCount++;
            const duplicateInfo: DuplicateInfo = {
              linha: recordNumber,
              num_distribuicao: dado.protocolo,
              cart_protesto: dado.cartorio,
              num_titulo: dado.numero_do_titulo,
              apresentante: dado.apresentante,
              vencimento: dado.vencimento,
              motivo: 'Registro já existe na base de dados',
            };
            duplicates.push(duplicateInfo);

            console.warn(
              `Registro ${recordNumber} duplicado - Distribuição: ${dado.protocolo}`,
            );
            continue;
          }

          // 3. Validação crítica - impede salvamento
          const criticalValidation = this.validateCriticalFields(dado);
          if (!criticalValidation.isValid) {
            skippedCount++;
            const errorMsg = `Registro ${recordNumber} pulado - Erros críticos: ${criticalValidation.errors.join(', ')}`;
            errors.push(errorMsg);
            console.warn(errorMsg);
            continue;
          }

          // 4. Validação de ressalvas - não impede salvamento mas conta como erro
          const warnings = this.validateWarningFields(dado);
          if (warnings.length > 0) {
            const warningMsg = `Registro ${recordNumber} salvo com ressalvas: ${warnings.join(', ')}`;
            errors.push(warningMsg);
            console.warn(warningMsg);
          }

          if (!logImportId) {
            throw new Error('logImportId é obrigatório para salvar registros');
          }

          // 5. Salvamento no banco
          await this.saveRecord(dado, logImportId);
          processedCount++;

          // 6. Atualizar progresso a cada 100 registros
          if ((i + 1) % 100 === 0) {
            await this.logArquivoImportService.updateProgress(logImportId, {
              registros_processados: processedCount,
              registros_com_erro: errorCount + skippedCount,
            });
          }
        } catch (itemError) {
          errorCount++;
          const errorMsg = `Erro no registro ${recordNumber}: ${itemError.message}`;
          errors.push(errorMsg);
          console.error(errorMsg, itemError);
          continue;
        }
      }

      return {
        processedCount,
        errorCount,
        skippedCount,
        duplicateCount,
        errors,
        duplicates,
      };
    } catch (error) {
      console.error('Erro ao iterar pelos dados:', error);
      throw new InternalServerErrorException(
        'Falha ao salvar os dados no banco de dados.',
      );
    }
  }

  private async saveRecord(
    dado: ImportData,
    logImportId: number,
  ): Promise<void> {
    // 1. Salvando apresentante
    const newApresentante = {
      nome: dado.apresentante,
      cod_apresentante: dado.codigo,
    };
    const savedApresentante =
      await this.apresentanteService.findOrCreate(newApresentante);

    // 2. Salvando credor
    const newCredor = {
      sacador: dado.sacador,
      cedente: dado.cedente,
      doc_credor: dado.documento_sacador,
    };
    const savedCredor = await this.credorService.findOrCreate(newCredor);

    console.log('::::::::::::saveRecord - logImportId::::::::::', logImportId);
    // 3. Salvando documento de protesto (com fk_file)
    const newDocProtesto = {
      vencimento: dado.vencimento,
      data_apresentacao: dado.data,
      num_distribuicao: dado.protocolo,
      data_distribuicao: dado.data_remessa,
      cart_protesto: dado.cartorio,
      num_titulo: dado.numero_do_titulo,
      valor: dado.valor,
      saldo: dado.saldo,
      fk_file: logImportId, // Relacionando com o arquivo de importação
      fk_apresentante: savedApresentante.id,
    };
    if (!logImportId) {
      throw new Error('logImportId é obrigatório mas está undefined');
    }
    const savedDocProtesto =
      await this.docProtestoService.create(newDocProtesto);

    // 4. Salvando devedor
    const newDevedor = {
      nome: dado.devedor,
      doc_devedor: dado.documento,
      devedor_pj: DocumentValidator.isValidCNPJ(dado.documento),
      fk_protesto: savedDocProtesto.id,
    };
    const savedDevedor = await this.devedorService.findOrCreate(newDevedor);

    // 5. Salvando log de notificação
    const newLogNotificacao = {
      fk_protesto: savedDocProtesto.id,
      fk_devedor: savedDevedor.id,
    };
    await this.logNotificacaoService.create(newLogNotificacao);

    // 6. Salvando relação protesto-credor
    const newRelacaoProtestoCredor = {
      fk_protesto: savedDocProtesto.id,
      fk_credor: savedCredor.id,
    };
    await this.relacaoProtestoCredorService.create(newRelacaoProtestoCredor);
  }
}
