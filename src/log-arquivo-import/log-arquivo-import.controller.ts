import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { LogArquivoImportService } from './log-arquivo-import.service';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-arquivo-import')
export class LogArquivoImportController {
  constructor(
    private readonly logArquivoImportService: LogArquivoImportService,
  ) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createLogArquivoImportDto: CreateLogArquivoImportDto) {
    return this.logArquivoImportService.create(createLogArquivoImportDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.logArquivoImportService.findAll();
  }

  @Get('all-and-user')
  @Roles(Role.USER, Role.ADMIN)
  findAllAndUser() {
    return this.logArquivoImportService.findAllAndUser();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.logArquivoImportService.findOne(+id);
  }

  @Get('status/:id')
  async getImportStatus(@Param('id') logId: string) {
    const logImport = await this.logArquivoImportService.findOne(+logId);

    if (!logImport) {
      throw new NotFoundException('Log de importação não encontrado');
    }

    // Calcular progresso percentual
    let progressPercentage = 0;
    if (logImport.total_registros > 0) {
      progressPercentage = Math.round(
        (logImport.registros_processados / logImport.total_registros) * 100,
      );
    }

    return {
      id: logImport.id,
      nome_arquivo: logImport.nome_arquivo,
      status: logImport.status,
      total_registros: logImport.total_registros,
      registros_processados: logImport.registros_processados,
      registros_com_erro: logImport.registros_com_erro,
      registros_duplicados: logImport.registros_duplicados,
      progress_percentage: progressPercentage,
      detalhes_erro: logImport.detalhes_erro,
      detalhes_duplicidade: logImport.detalhes_duplicidade,
      detalhes_progresso: logImport.detalhes_progresso, // Nova propriedade
      duracao: logImport.duracao,
      created_at: logImport.createdAt,
      updated_at: logImport.createdAt,
    };
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateLogArquivoImportDto: UpdateLogArquivoImportDto,
  ) {
    return this.logArquivoImportService.update(+id, updateLogArquivoImportDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.logArquivoImportService.remove(+id);
  }
}
