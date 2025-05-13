import { isValidDate, parseDateBrToIso } from '@app/common';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { ImportStrategy } from './strategies/import.strategy';
import { DocProtestoService } from 'src/doc-protesto/doc-protesto.service';
import { DevedorService } from '@app/devedor/devedor.service';
import { isValidCNPJ, isValidCPF } from '@brazilian-utils/brazilian-utils';

@Injectable()
export class ImportService {
  constructor(
    @Inject('IMPORT_STRATEGIES') private readonly strategies: ImportStrategy[],
    private readonly docProtestoService: DocProtestoService,
    private readonly devedorService: DevedorService,
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
      //MUDAR AQUI --> DADOS OF DADOS INTERA EM N VEZES N -->ERRO: ARRAY TEM 5 ELEMENTOS, VAI NTERAR 25 VEZES -> ERRO
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

        // SALVANDO  DE DOCUMENTO DE PROTESTO NO BANCO
        //eslint-disable-next-line
        const newDocProtesto = {
          vencimento: data_vencimento,
          data_apresentacao: data_apresentacao,
          num_distribuicao: dado.protocolo,
          data_distribuicao: data_distribuicao,
          cart_protesto: dado.cartorio,
          num_titulo: dado.numero_do_titulo,
        };
        //await this.docProtestoService.create(newDocProtesto);

        // SALVANDO DADOS DE DOCUMENTO DE DEVEDOR NO BANCO
        const newDevedor = {
          nome: dado.devedor,
          doc_devedor: dado.documento,
          devedor_pj: true,
        };

        console.log(newDevedor);
        //await this.devedorService.create(newDevedor);
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
