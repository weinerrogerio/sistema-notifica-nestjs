import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogNotificacaoService } from './log-notificacao.service';
import { CreateLogNotificacaoDto } from './dto/create-log-notificacao.dto';
import { UpdateLogNotificacaoDto } from './dto/update-log-notificacao.dto';

@Controller('log-notificacao')
export class LogNotificacaoController {
  constructor(private readonly logNotificacaoService: LogNotificacaoService) {}

  @Post()
  create(@Body() createLogNotificacaoDto: CreateLogNotificacaoDto) {
    return this.logNotificacaoService.create(createLogNotificacaoDto);
  }

  @Get()
  findAll() {
    return this.logNotificacaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logNotificacaoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogNotificacaoDto: UpdateLogNotificacaoDto) {
    return this.logNotificacaoService.update(+id, updateLogNotificacaoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logNotificacaoService.remove(+id);
  }
}
