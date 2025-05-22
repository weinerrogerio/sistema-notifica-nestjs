import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LogArquivoService } from './log-arquivo.service';
import { CreateLogArquivoDto } from './dto/create-log-arquivo.dto';
import { UpdateLogArquivoDto } from './dto/update-log-arquivo.dto';

@Controller('log-arquivo')
export class LogArquivoController {
  constructor(private readonly logArquivoService: LogArquivoService) {}

  @Post()
  create(@Body() createLogArquivoDto: CreateLogArquivoDto) {
    console.log(' chamando createLogArquivoDto :::');
    return this.logArquivoService.create(createLogArquivoDto);
  }

  @Get()
  findAll() {
    return this.logArquivoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logArquivoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLogArquivoDto: UpdateLogArquivoDto,
  ) {
    return this.logArquivoService.update(+id, updateLogArquivoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logArquivoService.remove(+id);
  }
}
