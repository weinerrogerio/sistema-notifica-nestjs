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
import { isValidCNPJ } from '@brazilian-utils/brazilian-utils';

// aqui irá conter os create e update de importacao --> receber dados verificado e salvar em user.create , docProtesto.create...
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
  ) {}
  // FUNÇÃO RESPONSAVEL POR GUARDAR OS DADOS NO BANCO SO ARQUIVO XML --> CHAMAR ESSA FUNÇAÕ EM STRATEGY XML(xml.strategy.ts)
  async xmlCreate(data: ImportData[], tokenPayload: TokenPayloadDto) {
    console.log('xmlCreate: ', data.length, tokenPayload);

    // SALVANDO DADOS NO BANCO
    try {
      for (const dado of data) {
        // ----------------------  SALVANDO APRESENTANTE -----------------------------
        const newApresentante = {
          nome: dado.apresentante,
          cod_apresentante: dado.codigo,
        };
        const savedApresentante =
          await this.apresentanteService.findOrCreate(newApresentante);

        //   ----------------------  SALVANDO CREDOR ----------------------
        const newCredor = {
          sacador: dado.sacador,
          cedente: dado.cedente,
          doc_credor: dado.documento_sacador,
        };
        const savedCredor = await this.credorService.findOrCreate(newCredor);

        //   ---------- SALVANDO DADOS DE DOCUMENTO DE PROTESTO NO BANCO -------------
        const newDocProtesto = {
          vencimento: dado.vencimento,
          data_apresentacao: dado.data,
          num_distribuicao: dado.protocolo,
          data_distribuicao: dado.data_remessa,
          cart_protesto: dado.cartorio,
          num_titulo: dado.numero_do_titulo,
          valor: dado.valor,
          saldo: dado.saldo,
          fk_apresentante: savedApresentante.id,
        };
        const savedDocProtesto =
          await this.docProtestoService.create(newDocProtesto);
        console.log('savedDocProtesto: :::', savedDocProtesto);

        //  ---------------- SALVANDO DADOS DEVEDOR NO BANCO  --------------------------
        const newDevedor = {
          nome: dado.devedor,
          //remover mascara--> onlyNumbers
          doc_devedor: dado.documento, //apenas numeros
          devedor_pj: isValidCNPJ(dado.documento), // pessoa juridica? boolean
          fk_protesto: savedDocProtesto.id,
        };
        const savedDevedor = await this.devedorService.findOrCreate(newDevedor);

        //  ---------SALVANDO LOG DE NOTIFICACAO - RELAÇÃO N:N  ------------------
        const newLogNotificacao = {
          email_enviado: false,
          data_envio: new Date(),
          lido: false,
          fk_id_protesto: savedDocProtesto.id,
          fk_id_devedor: savedDevedor.id,
        };
        await this.logNotificacaoService.create(newLogNotificacao);

        //  ---------SALVANDO RELAÇÃO PROTESTO-CREDOR N:N  ------------------
        const newRelacaoProtestoCredor = {
          fk_protesto: savedDocProtesto.id,
          fk_credor: savedCredor.id,
        };
        await this.relacaoProtestoCredorService.create(
          newRelacaoProtestoCredor,
        );
      }
    } catch (error) {
      console.error('Erro ao iterar pelos dados:', error);
      //throw new Error('Falha ao processar os dados importados.');
      throw new InternalServerErrorException(
        'Falha ao salvar os dados no banco de dados.',
      );
    }
  }
}
