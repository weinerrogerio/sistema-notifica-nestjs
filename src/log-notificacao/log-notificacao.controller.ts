import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LogNotificacaoService } from './log-notificacao.service';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-notificacao')
export class LogNotificacaoController {
  constructor(private readonly logNotificacaoService: LogNotificacaoService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createLogNotificacaoDto: CreateLogNotificacaoDto) {
    return this.logNotificacaoService.create(createLogNotificacaoDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.logNotificacaoService.findAll();
  }

  /* -------------------------------------   BUSCAS  -------------------------------------- */

  //BUSCA POR NOTIFICAÇÕES PENDENTES
  @Get('busca-all')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesAll() {
    const intimacoes =
      await this.logNotificacaoService.buscarNotificacoesPendentesAll();
    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES NÃO ENVIADAS
  @Get('busca-nao-enviadas')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesNnaoEnviadas() {
    const intimacoes =
      await this.logNotificacaoService.buscarNotificacoesPendentesNaoEnviadas();
    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DEVEDOR
  @Get('busca/:devedorId')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesPorDevedor(@Body() devedorId: number) {
    const intimacoes =
      await this.logNotificacaoService.buscarNotificacoesPendentesPorDevedor(
        devedorId,
      );
    return intimacoes;
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES COMPLETAS
  @Get('busca-completa')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesCompletas() {
    return await this.logNotificacaoService.buscarNotificacoesPendentesAllData();
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DEVEDOR - id notificação
  @Get('busca-completa/:id')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesCompletasById(@Param('id') id: number) {
    return await this.logNotificacaoService.buscarNotificacaoPendenteAllDataById(
      id,
    );
  }

  //BUSCA POR NOTIFICAÇÕES PENDENTES POR DISTRIBUIÇÃO
  @Get('busca/distribuicao/:numDistribuicao')
  @Roles(Role.USER, Role.ADMIN)
  async buscarNotificacoesPendentesPorDistribuicao(
    @Body() numDistribuicao: string,
  ) {
    const intimacoes =
      await this.logNotificacaoService.buscarNotificacoesPendentesPorDistribuicao(
        numDistribuicao,
      );

    return intimacoes;
  }

  // ------------------------------ ROTAS COM PARAMETROS DINAMICOS ------------------------------
  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.logNotificacaoService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateLogNotificacaoDto: UpdateLogNotificacaoDto,
  ) {
    return this.logNotificacaoService.update(+id, updateLogNotificacaoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.logNotificacaoService.remove(+id);
  }
}
