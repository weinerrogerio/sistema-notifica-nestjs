import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DocProtestoService } from './doc-protesto.service';
import { CreateDocProtestoDto } from './dto/create-doc-protesto.dto';
import { UpdateDocProtestoDto } from './dto/update-doc-protesto.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { DocProtestoSearchService } from './services/doc-protesto-search.service';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('doc-protesto')
export class DocProtestoController {
  constructor(
    private readonly docProtestoService: DocProtestoService,
    private readonly docProtestoSearchService: DocProtestoSearchService,
  ) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createDocProtestoDto: CreateDocProtestoDto) {
    return this.docProtestoService.create(createDocProtestoDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.docProtestoService.findAll();
  }

  // busca simples por data de criação de registro
  @Get('date-range')
  async getByDateRange(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.docProtestoService.findByDateRange(start, end);
  }

  // busca todas as distribuições por data de craição de registro
  @Get('date-range-query')
  async getByDateRangeWithQuery(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.docProtestoService.findByDateRangeAllData(start, end);
  }

  //Busca todas as distribuições por data de distribuição
  @Get('date-range-query-dist')
  async getByDateRangeDistWithQuery(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.docProtestoService.findByDateRangeDistAllData(start, end);
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.docProtestoService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDocProtestoDto: UpdateDocProtestoDto,
  ) {
    return this.docProtestoService.update(+id, updateDocProtestoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.docProtestoService.remove(+id);
  }

  // Busca por devedor específico
  @Get('distribuicoes/devedor/:devedorId')
  @Roles(Role.USER, Role.ADMIN)
  async buscarDistribuicoesPorDevedor(@Param('devedorId') devedorId: number) {
    return await this.docProtestoSearchService.buscarDistribuicoesPorDevedor(
      devedorId,
    );
  }

  // Busca geral com filtros
  @Get('distribuicoes/buscar')
  @Roles(Role.USER, Role.ADMIN)
  async buscarDistribuicoes(
    @Query('devedorNome') devedorNome?: string,
    @Query('docDevedor') docDevedor?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('status') status?: string,
  ) {
    const filtros = {
      devedorNome,
      docDevedor,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      status,
    };

    return await this.docProtestoSearchService.buscarDistribuicoesComFiltros(
      filtros,
    );
  }
}
