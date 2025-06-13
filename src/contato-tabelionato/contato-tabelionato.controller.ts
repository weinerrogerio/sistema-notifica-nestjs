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
import { ContatoTabelionatoService } from './contato-tabelionato.service';
import { CreateContatoTabelionatoDto } from './dto/create-contato-tabelionato.dto';
import { UpdateContatoTabelionatoDto } from './dto/update-contato-tabelionato.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('contato-tabelionato')
export class ContatoTabelionatoController {
  constructor(
    private readonly contatoTabelionatoService: ContatoTabelionatoService,
  ) {}

  @Roles(Role.USER, Role.ADMIN)
  @Get()
  findAll() {
    return this.contatoTabelionatoService.findAll();
  }
  @Roles(Role.USER, Role.ADMIN)
  @Post()
  create(@Body() createContatoTabelionatoDto: CreateContatoTabelionatoDto) {
    return this.contatoTabelionatoService.create(createContatoTabelionatoDto);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contatoTabelionatoService.findOne(+id);
  }
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContatoTabelionatoDto: UpdateContatoTabelionatoDto,
  ) {
    return this.contatoTabelionatoService.update(
      +id,
      updateContatoTabelionatoDto,
    );
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contatoTabelionatoService.remove(+id);
  }
}
