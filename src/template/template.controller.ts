import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';

export interface UploadTemplateRequest {
  nome: string;
  descricao?: string;
  conteudoHtml: string;
  nomeArquivo: string;
  criadoPor?: string;
}

export interface PreviewRequest {
  conteudoHtml: string;
  dadosTeste: any;
}

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('template')
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Roles(Role.USER, Role.ADMIN)
  @Get()
  async listarTemplates() {
    try {
      return await this.templateService.listarTodos();
    } catch (error) {
      console.log(`ERRO AO BUSCAR TEMPLATES: ${error}`);
      throw new HttpException(
        'Erro ao buscar templates',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('estatisticas')
  async obterEstatisticas() {
    try {
      return await this.templateService.obterEstatisticas();
    } catch (error) {
      console.log(`ERRO AO BUSCAR estatisticas DE TEMPLATES: ${error}`);
      throw new HttpException(
        'Erro ao obter estatísticas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('padrao')
  async obterTemplatePadrao() {
    try {
      return await this.templateService.getDefaultTemplate();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao buscar template padrão',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('ajuda/placeholders')
  async listarPlaceholders() {
    try {
      // Retorna a lista de todas as chaves válidas que o usuário pode usar
      const placeholders = this.templateService.getValidPlaceholders();
      return {
        mensagem:
          'Use estes placeholders no seu template HTML, dentro de chaves duplas (ex: {{devedor.nome}})',
        placeholders: placeholders,
      };
    } catch (error) {
      console.log(`ERRO AO BUSCAR PLACEHOLDERS: ${error}`);
      throw new HttpException(
        'Erro ao buscar lista de placeholders',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'templateFile' deve ser o nome do campo no Postman
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File, // Este será o arquivo
  ) {
    try {
      // Validações básicas para os campos do body
      if (!file) {
        throw new HttpException(
          'Nenhum arquivo de template foi enviado',
          HttpStatus.BAD_REQUEST,
        );
      }
      const conteudoHtml = file.buffer.toString('utf8'); // Conteúdo do arquivo como string
      const nomeArquivo = file.originalname;

      if (!nomeArquivo.trim()) {
        throw new HttpException(
          'Nome do template é obrigatório',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!file.mimetype.includes('text/html')) {
        throw new HttpException(
          'Formato de arquivo inválido. Apenas arquivos HTML são permitidos.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validações para o conteúdo HTML e nome do arquivo
      if (!conteudoHtml.trim()) {
        throw new HttpException(
          'Conteúdo HTML é obrigatório',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar se é HTML válido (verificação básica)
      if (!this.isValidHtml(conteudoHtml)) {
        // Você precisaria ter isValidHtml no seu controller
        throw new HttpException(
          'Conteúdo HTML inválido ou malformado',
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log(file);

      return await this.templateService.criar(file);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Erro ao fazer upload do template  ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id')
  async buscarTemplate(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.templateService.buscarPorId(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao buscar template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id/conteudo')
  async obterConteudoTemplate(@Param('id', ParseIntPipe) id: number) {
    try {
      const conteudo = await this.templateService.obterConteudoTemplate(id);
      return { conteudoHtml: conteudo };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao obter conteúdo do template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id/verificar-integridade')
  async verificarIntegridade(@Param('id', ParseIntPipe) id: number) {
    try {
      const integro = await this.templateService.verificarIntegridade(id);
      return { integro };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao verificar integridade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Post(':id/set-padrao')
  async definirTemplatePadrao(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.templateService.definirComoPadrao(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao definir template padrão',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Roles(Role.USER, Role.ADMIN)
  @Delete(':id')
  async deletarTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Query('fisico') deletarFisico?: string,
  ) {
    try {
      if (deletarFisico === 'true') {
        await this.templateService.deletarFisicamente(id);
        return { message: 'Template deletado fisicamente com sucesso' };
      } else {
        await this.templateService.deletar(id);
        return { message: 'Template marcado como inativo com sucesso' };
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erro ao deletar template',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //@Roles(Role.USER, Role.ADMIN)
  private isValidHtml(html: string): boolean {
    // Validação básica - verifica estrutura mínima de HTML
    const htmlTrimmed = html.trim();
    // Deve conter pelo menos uma tag HTML
    if (!htmlTrimmed.includes('<') || !htmlTrimmed.includes('>')) {
      return false;
    }

    // Verificações mais específicas
    const hasHtmlTag = /<!DOCTYPE|<html/i.test(htmlTrimmed);
    const hasBasicStructure = /<head|<body|<title/i.test(htmlTrimmed);
    const hasClosingTags = htmlTrimmed.includes('</');

    // Se tem estrutura HTML completa, deve ter elementos básicos
    if (hasHtmlTag) {
      return hasBasicStructure && hasClosingTags;
    }

    // Se não tem estrutura completa, aceita fragmentos HTML válidos
    return hasClosingTags || this.isValidHtmlFragment(htmlTrimmed);
  }

  private isValidHtmlFragment(html: string): boolean {
    // Verifica se é um fragmento HTML válido (ex: só o body, só algumas divs, etc.)
    const commonTags = /<(div|p|span|h[1-6]|table|ul|ol|li|a|img|br|hr)/i;
    return commonTags.test(html);
  }
}
