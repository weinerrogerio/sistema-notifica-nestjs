import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContatoTabelionatoService } from './contato-tabelionato.service';
import { CreateContatoTabelionatoDto } from './dto/create-contato-tabelionato.dto';
import { UpdateContatoTabelionatoDto } from './dto/update-contato-tabelionato.dto';

@Controller('contato-tabelionato')
export class ContatoTabelionatoController {
  constructor(private readonly contatoTabelionatoService: ContatoTabelionatoService) {}

  @Post()
  create(@Body() createContatoTabelionatoDto: CreateContatoTabelionatoDto) {
    return this.contatoTabelionatoService.create(createContatoTabelionatoDto);
  }

  @Get()
  findAll() {
    return this.contatoTabelionatoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contatoTabelionatoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContatoTabelionatoDto: UpdateContatoTabelionatoDto) {
    return this.contatoTabelionatoService.update(+id, updateContatoTabelionatoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contatoTabelionatoService.remove(+id);
  }
}
