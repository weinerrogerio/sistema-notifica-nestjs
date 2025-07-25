import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import * as Handlebars from 'handlebars';
import * as crypto from 'crypto';
import { IntimacaoDataCompleto } from '@app/common/interfaces/notification-data.interface';
import { ContatoTabelionato } from '@app/contato-tabelionato/entities/contato-tabelionato.entity';

export interface CriarTemplateDto {
  originalname: string;
  descricao?: string;
  conteudoHtml: string;
  nomeArquivo: string;
  criadoPor?: string;
}

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
  ) {}

  async listarTodos(): Promise<Template[]> {
    return this.templateRepository.find({
      where: { ativo: true },
      order: {
        ehPadrao: 'DESC',
        criadoEm: 'DESC',
      },
      select: [
        'id',
        'nomeArquivo',
        'descricao',
        'tamanhoArquivo',
        'ehPadrao',
        'ativo',
        'criadoEm',
        'atualizadoEm',
        'criadoPor',
        // Não incluir conteudoHtml na listagem para melhor performance
      ],
    });
  }

  async buscarPorId(id: number): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id, ativo: true },
    });

    if (!template) {
      throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
    }

    return template;
  }

  // Retorna o template padrão
  async getDefaultTemplate(): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { ehPadrao: true, ativo: true },
    });

    if (!template) {
      throw new HttpException(
        'Template padrão não encontrado no banco de dados.',
        HttpStatus.NOT_FOUND,
      );
    }

    return template;
  }

  // Renderiza o template com os dados fornecidos
  /* async renderTemplate(
    templateHtml: string,
    dados: IntimacaoData,
    trackingPixelUrl?: string, // Pode ser opcional
    contatoTabelionato?: ContatoTabelionato,
  ): Promise<string> {
    // Compile o template Handlebars
    const template = Handlebars.compile(templateHtml);
    // Prepare os dados para o template. É importante que os nomes aqui correspondam
    // aos placeholders que o usuário vai escrever no DB (ex: {{dados.nomeDevedor}})
    const context = {
      dados: {
        ...dados,
        // Formate o valorTotal aqui, se necessário, para evitar lógica no template
        valorTotal: dados.valorTotal.toFixed(2).replace('.', ','),
        // Se dataDistribuicao é um Date, formate-o para string
        dataDistribuicao:
          dados.dataDistribuicao instanceof Date
            ? dados.dataDistribuicao.toLocaleDateString('pt-BR')
            : dados.dataDistribuicao,
      },
      contato: contatoTabelionato, // Passa o objeto de contato
      // Para o pixel de tracking, o template pode ter um placeholder como {{trackingPixel}}
      trackingPixel: trackingPixelUrl
        ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`
        : '',
    };

    // Renderize o template com o contexto
    return template(context);
  } */

  async renderTemplate(
    templateHtml: string,
    dados: IntimacaoDataCompleto,
    trackingPixelUrl: string,
    contatoTabelionato?: ContatoTabelionato,
  ): Promise<string> {
    // Compile o template Handlebars
    const template = Handlebars.compile(templateHtml);

    console.log('TrackingPixelUrl: ', trackingPixelUrl);

    // Prepare os dados para o template. É importante que os nomes aqui correspondam
    // aos placeholders que o usuário vai escrever no DB (ex: {{dados.nomeDevedor}})
    const context = {
      dados: {
        ...dados,
        // Formate o valorTotal aqui, se necessário, para evitar lógica no template
        valorTotal: dados.protesto.saldo.toFixed(2).replace('.', ','),
        // Se dataDistribuicao é um Date, formate-o para string
        dataDistribuicao:
          dados.protesto.data_distribuicao instanceof Date
            ? dados.protesto.data_distribuicao.toLocaleDateString('pt-BR')
            : dados.protesto.data_distribuicao,
      },
      contato: contatoTabelionato, // Passa o objeto de contato
      // Para o pixel de tracking, o template pode ter um placeholder como {{trackingPixel}}
      trackingPixelUrl: trackingPixelUrl,
      /* trackingPixelUrl: trackingPixelUrl
        ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="Teste" />`
        : '', */
    };

    // Renderize o template com o contexto
    return template(context);
  }

  //  async criar(dadosTemplate: CriarTemplateDto): Promise<Template> {
  async criar(file: Express.Multer.File): Promise<Template> {
    // Verificar se já existe template com o mesmo nome
    const templateExistente = await this.templateRepository.findOne({
      where: { nomeArquivo: file.originalname, ativo: true },
    });

    if (templateExistente) {
      throw new HttpException(
        `Já existe um template com o nome '${file.originalname}'`,
        HttpStatus.CONFLICT,
      );
    }

    // Calcular hash do conteúdo
    const hashConteudo = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Calcular tamanho em bytes
    const tamanhoArquivo = Buffer.byteLength(file.buffer, 'utf8');

    // Validar tamanho máximo (ex: 20MB)
    const tamanhoMaximo = 20 * 1024 * 1024; // 20MB
    if (tamanhoArquivo > tamanhoMaximo) {
      throw new HttpException(
        'Template muito grande. Tamanho máximo permitido: 20MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('FILES SERVICE: ', file);

    const template = this.templateRepository.create({
      descricao: file.originalname || '',
      conteudoHtml: file.buffer.toString('utf8'),
      nomeArquivo: file.originalname,
      tamanhoArquivo,
      hashConteudo,
      tipoMime: 'text/html',
      ehPadrao: false,
      ativo: true,
      criadoPor: '',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });

    return this.templateRepository.save(template);
  }

  async definirComoPadrao(id: number): Promise<Template> {
    const template = await this.buscarPorId(id);

    // Remover flag de padrão de todos os outros templates
    await this.templateRepository.update(
      { ehPadrao: true },
      { ehPadrao: false },
    );

    // Definir o template atual como padrão
    template.ehPadrao = true;
    template.atualizadoEm = new Date();

    return this.templateRepository.save(template);
  }

  async deletar(id: number): Promise<void> {
    const template = await this.buscarPorId(id);

    if (template.ehPadrao) {
      throw new HttpException(
        'Não é possível excluir o template padrão',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Soft delete - marca como inativo ao invés de deletar fisicamente
    template.ativo = false;
    template.atualizadoEm = new Date();

    await this.templateRepository.save(template);
  }

  async deletarFisicamente(id: number): Promise<void> {
    const template = await this.buscarPorId(id);

    if (template.ehPadrao) {
      throw new HttpException(
        'Não é possível excluir o template padrão',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.templateRepository.delete(id);
  }

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  async gerarPreview(conteudoHtml: string, dadosTeste: any): Promise<string> {
    try {
      // Compilar template com Handlebars
      const template = Handlebars.compile(conteudoHtml);

      // Gerar HTML com dados de teste
      const htmlGerado = template(dadosTeste);

      return htmlGerado;
    } catch (error) {
      throw new HttpException(
        `Erro ao processar template: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async obterConteudoTemplate(id: number): Promise<string> {
    const template = await this.buscarPorId(id);
    return template.conteudoHtml;
  }

  async verificarIntegridade(id: number): Promise<boolean> {
    const template = await this.buscarPorId(id);

    if (!template.hashConteudo) {
      return true; // Se não tem hash, assume que está íntegro
    }

    const hashAtual = crypto
      .createHash('sha256')
      .update(template.conteudoHtml)
      .digest('hex');

    return hashAtual === template.hashConteudo;
  }

  async obterEstatisticas(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    padrao: string;
    tamanhoTotal: number;
  }> {
    const todos = await this.templateRepository.find();
    const ativos = todos.filter((t) => t.ativo);
    const inativos = todos.filter((t) => !t.ativo);
    const padrao = todos.find((t) => t.ehPadrao);
    const tamanhoTotal = todos.reduce((sum, t) => sum + t.tamanhoArquivo, 0);

    return {
      total: todos.length,
      ativos: ativos.length,
      inativos: inativos.length,
      padrao: padrao?.nomeArquivo || 'Nenhum',
      tamanhoTotal,
    };
  }
}
