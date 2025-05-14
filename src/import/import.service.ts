import { isValidDate, parseDateBrToIso } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  isValidCNPJ,
  isValidCPF,
  onlyNumbers,
} from '@brazilian-utils/brazilian-utils';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { DocProtestoService } from 'src/doc-protesto/doc-protesto.service';
import { DevedorService } from '@app/devedor/devedor.service';
import { LogNotificacaoService } from '@app/log-notificacao/log-notificacao.service';
import { CredorService } from '@app/credor/credor.service';
import { ApresentanteService } from '@app/apresentante/apresentante.service';
import { DocProtestoCredorService } from '@app/doc-protesto_credor/doc-protesto_credor.service';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES')
    private readonly strategies: ImportStrategy[],
    private readonly docProtestoService: DocProtestoService,
    private readonly devedorService: DevedorService,
    private readonly credorService: CredorService,
    private readonly apresentanteService: ApresentanteService,
    private readonly logNotificacaoService: LogNotificacaoService,
    private readonly relacaoProtestoCredorService: DocProtestoCredorService,
  ) {}

  create(createImportDto: CreateImportDto) {
    console.log(createImportDto);
    return 'This action adds a new import';
  }

  findAll() {
    return `This action returns all import`;
  }

  findOne(id: number) {
    return `This action returns a #${id} import`;
  }

  update(id: number, updateImportDto: UpdateImportDto) {
    console.log(updateImportDto);

    return `This action updates a #${id} import`;
  }

  remove(id: number) {
    return `This action removes a #${id} import`;
  }

  async importFile(file: Express.Multer.File) {
    const strategy = this.strategies.find((s) => s.canHandle(file.mimetype));
    if (!strategy) {
      throw new BadRequestException(
        `Formato de arquivo não suportado. ${file.mimetype}`,
      );
    }
    const dados = await strategy.import(file.buffer);

    if (!Array.isArray(dados)) {
      throw new Error('O resultado da importação não é um array.');
    }

    for (let i = 0; i < dados.length; i++) {
      const dado = dados[i];
      const isCpfValid = isValidCPF(dado.documento);
      const isCnpjValid = isValidCNPJ(dado.documento);
      // Se não for nem CPF válido nem CNPJ válido, lança erro
      if (!isCpfValid && !isCnpjValid) {
        throw new BadRequestException(
          `Linha ${i + 1}: Documento inválido (${dado.documento}) para devedor: ${dado.devedor}`,
        );
      }
      // outras validações aqui
    }

    // SALVANDO DADOS NO BANCO
    try {
      for (const dado of dados) {
        console.log(dado);

        const data_vencimento = isValidDate(dado.vencimento)
          ? new Date(dado.vencimento)
          : parseDateBrToIso(dado.vencimento);

        const data_apresentacao = isValidDate(dado.data_protocolo)
          ? new Date(dado.data_protocolo)
          : parseDateBrToIso(dado.data_protocolo);

        const data_distribuicao = isValidDate(dado.data_remessa)
          ? new Date(dado.data_remessa)
          : parseDateBrToIso(dado.data_remessa);

        // ----------------------  SALVANDO APRESENTANTE ----------------------
        const newApresentante = {
          nome: dado.apresentante,
          cod_apresentante: dado.codigo,
        };
        console.log(newApresentante);

        /* const savedApresentante = */ await this.apresentanteService.findOrCreate(
          newApresentante,
        );

        //   ------------ SALVANDO DADOS DE DOCUMENTO DE PROTESTO NO BANCO -------------
        const newDocProtesto = {
          vencimento: data_vencimento,
          data_apresentacao: data_apresentacao,
          num_distribuicao: dado.protocolo,
          data_distribuicao: data_distribuicao,
          cart_protesto: dado.cartorio,
          num_titulo: dado.numero_do_titulo,
        };
        const savedDocProtesto =
          await this.docProtestoService.create(newDocProtesto);

        //  --------------- SALVANDO DADOS DEVEDOR NO BANCO  ----------------------
        const newDevedor = {
          nome: dado.devedor,
          //remover mascara--> onlyNumbers
          doc_devedor: onlyNumbers(dado.documento),
          devedor_pj: isValidCNPJ(dado.documento),
        };
        const savedDevedor = await this.devedorService.findOrCreate(newDevedor);

        //  ---------SALVANDO LOG DE NOTIFICACAO - RELAÇÃO N:N  ------------------
        const newLogNotificacao = {
          email_enviado: false,
          data_envio: new Date(),
          lido: false,
          fk_id_protest: savedDocProtesto.id,
          fk_id_devedor: savedDevedor.id,
        };
        await this.logNotificacaoService.create(newLogNotificacao);

        //   ----------------------  SALVANDO CREDOR ----------------------
        const newCredor = {
          sacador: dado.sacador,
          cedente: dado.cedente,
          doc_credor: dado.documento_sacador,
        };
        const savedCredor = await this.credorService.create(newCredor);

        //   -------  SALVANDO LOG DOCPROTESTO E CREDOR - RELAÇÃO N:N ----------------------

        const newRelacaoProtestoCredor = {
          fk_doc_protesto: savedDocProtesto.id,
          fk_credor: savedCredor.id,
        };
        await this.relacaoProtestoCredorService.create(
          newRelacaoProtestoCredor,
        );
        //
      }
    } catch (err) {
      console.error('Erro ao iterar pelos dados:', err);
      //throw new Error('Falha ao processar os dados importados.');
      throw new InternalServerErrorException(
        'Falha ao salvar os dados no banco de dados.',
      );
    }
    //return dados;
  }
}
