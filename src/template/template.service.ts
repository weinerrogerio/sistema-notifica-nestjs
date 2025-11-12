import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import * as Handlebars from 'handlebars';
import * as crypto from 'crypto';
import { NotificationData } from '@app/common/interfaces/notification-data.interface';

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
    viewModel: NotificationData,
  ): Promise<string> {
    // DADOS DEVEM CHEGAR AQUI JA FORMATADOS!
    // Compile o template Handlebars
    const template = Handlebars.compile(templateHtml);
    console.log('TrackingPixelUrl: ', viewModel.urls.trackingPixel);
    // Prepare os dados para o template. É importante que os nomes aqui correspondam
    // aos placeholders que o usuário vai escrever no DB (ex: {{dados.nomeDevedor}})
    const context = {
      dados: {
        devedor: viewModel.devedor, // Para {{dados.devedor.nome}}
        protesto: {
          saldo: viewModel.titulo.saldo,
          valor: viewModel.titulo.valor,
          vencimento: viewModel.titulo.vencimento,
          num_distribuicao: viewModel.distribuicao.numero,
          data_distribuicao: viewModel.distribuicao.data,

          // Mapeia o 'portador' do ViewModel
          apresentante: viewModel.portador, // Para {{dados.protesto.apresentante.nome}}

          // Mapeia o 'credor' do ViewModel
          // O template antigo esperava {{dados.protesto.credor.sacador}}
          credor: {
            sacador: viewModel.credor.nome,
          },
        },
      },

      // O template espera {{contato. ...}}
      contato: viewModel.cartorio, // Para {{contato.nomeTabelionato}}

      // O template pode esperar o pixel na raiz
      trackingPixelUrl: viewModel.urls.trackingPixel,
    };
    // 3. Renderiza com o contexto traduzido
    return template(context);
  } */
  async renderTemplate(
    templateHtml: string,
    viewModel: NotificationData, // Recebe o ViewModel
  ): Promise<string> {
    try {
      const template = Handlebars.compile(templateHtml);
      return template(viewModel);
    } catch (error) {
      console.error('Erro ao renderizar template Handlebars:', error);
      throw new HttpException(
        `Erro ao processar template: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extrairTodasChavesHandlebars(html: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const encontrados: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      const conteudo = match[1].trim(); // O que está entre {{ e }}
      encontrados.push(conteudo);
    }

    return encontrados;
  }

  private extrairSintaxeDolar(html: string): string[] {
    const regex = /\$\{([^}]+)\}/g;
    const encontrados: string[] = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
      encontrados.push(match[1].trim());
    }

    return encontrados;
  }

  private isHandlebarsHelper(placeholder: string): boolean {
    return (
      placeholder.startsWith('#') ||
      placeholder.startsWith('/') ||
      placeholder === 'else' ||
      placeholder === 'this'
    );
  }

  public getValidPlaceholders(): string[] {
    // Criamos um "molde" que imita a interface NotificationData --> alterar aqui toda vez que atualizar a interface
    //  apenas a ESTRUTURA importa --> {{schema.devedor.nome}}
    const data = {
      devedor: {
        nome: 'string',
        documento: 'string',
        email: 'string',
        tipo: 'string',
      },
      titulo: {
        numero: 'string',
        valor: 'string',
        saldo: 'string',
        vencimento: 'string',
      },
      distribuicao: {
        numero: 'string',
        data: 'string',
        dataApresentacao: 'string',
      },
      cartorio: {
        nome: 'string',
        codigo: 'string',
        telefone: 'string',
        email: 'string',
        endereco: 'string',
        cidade: 'string',
        uf: 'string',
        cep: 'string',
      },
      credor: { nome: 'string', documento: 'string', tipo: 'string' },
      portador: { nome: 'string', codigo: 'string' },
      urls: {
        trackingPixel: 'string',
        aceiteIntimacao: 'string',
        consultaProtesto: 'string',
        pagamento: 'string',
      },
      metadata: {
        notificacaoId: 'number',
        dataEnvio: 'string',
        templateId: 'number',
      },
    };

    // Função interna para "achatar" o objeto e gerar os caminhos
    const getPaths = (obj: object, prefix = ''): string[] => {
      let paths: string[] = [];
      for (const key of Object.keys(obj)) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          paths = paths.concat(getPaths(val, newPrefix));
        } else {
          paths.push(newPrefix);
        }
      }
      return paths;
    };

    return getPaths(data);
  }

  /*** Valida o conteúdo HTML contra a lista de placeholders válidos.*/
  public validarTemplate(html: string): {
    valido: boolean;
    sintaxeDolar: string[]; // ${...} encontrados (sintaxe errada)
    placeholdersInvalidos: string[]; // {{...}} que não estão na legenda
    helpersInvalidos: string[]; // {{this.method()}}, {{algo()}} etc
  } {
    const placeholdersValidos = new Set(this.getValidPlaceholders());

    // 1. Busca sintaxe ERRADA: ${...}
    const sintaxeDolar = this.extrairSintaxeDolar(html);

    // 2. Busca TUDO dentro de {{...}}
    const todasChaves = this.extrairTodasChavesHandlebars(html);

    const placeholdersInvalidos: string[] = [];
    const helpersInvalidos: string[] = [];

    for (const placeholder of todasChaves) {
      // Ignora helpers válidos do Handlebars (#each, #if, /each, /if, else)
      if (this.isHandlebarsHelper(placeholder)) {
        continue;
      }

      // Se contém parênteses, não é um placeholder válido
      if (placeholder.includes('(') || placeholder.includes(')')) {
        helpersInvalidos.push(placeholder);
        continue;
      }

      // Verifica se está na legenda
      if (!placeholdersValidos.has(placeholder)) {
        placeholdersInvalidos.push(placeholder);
      }
    }

    // Template é válido APENAS se não tiver nenhum erro
    const ehValido =
      sintaxeDolar.length === 0 &&
      placeholdersInvalidos.length === 0 &&
      helpersInvalidos.length === 0;

    return {
      valido: ehValido,
      sintaxeDolar,
      placeholdersInvalidos,
      helpersInvalidos,
    };
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
    const conteudoHtml = file.buffer.toString('utf8');

    // VALIDAÇÃO COM NOVA LÓGICA
    const validacao = this.validarTemplate(conteudoHtml);

    if (!validacao.valido) {
      const errorResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'O template contém erros e não pode ser salvo.',
        erros: {},
        placeholdersValidos: this.getValidPlaceholders(),
      };

      // Erro 1: Sintaxe ${...} ao invés de {{...}}
      if (validacao.sintaxeDolar.length > 0) {
        errorResponse.erros['sintaxeInvalida'] =
          `Sintaxe inválida encontrada. Use chaves duplas {{...}} ao invés de \${...} para estas variáveis: ${validacao.sintaxeDolar.join(', ')}`;
      }

      // Erro 2: Helpers/funções não permitidos
      if (validacao.helpersInvalidos.length > 0) {
        errorResponse.erros['helpersInvalidos'] =
          `Remova ou modifique: ${validacao.helpersInvalidos.map((h) => `{{${h}}}`).join(', ')}`;
      }

      // Erro 3: Variáveis que não existem na legenda
      if (validacao.placeholdersInvalidos.length > 0) {
        errorResponse.erros['placeholdersInvalidos'] =
          `Variáveis não reconhecidas (não existem na legenda): ${validacao.placeholdersInvalidos.map((p) => `{{${p}}}`).join(', ')}`;
      }

      console.log(errorResponse);
      throw new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Validar tamanho máximo (ex: 20MB)
    const tamanhoMaximo = 20 * 1024 * 1024;
    if (tamanhoArquivo > tamanhoMaximo) {
      throw new HttpException(
        'Template muito grande. Tamanho máximo permitido: 20MB',
        HttpStatus.BAD_REQUEST,
      );
    }

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
