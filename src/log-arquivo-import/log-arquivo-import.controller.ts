import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogArquivoImportService } from './log-arquivo-import.service';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';

@Controller('log-arquivo-import')
export class LogArquivoImportController {
  constructor(private readonly logArquivoImportService: LogArquivoImportService) {}

  @Post()
  create(@Body() createLogArquivoImportDto: CreateLogArquivoImportDto) {
    return this.logArquivoImportService.create(createLogArquivoImportDto);
  }

  @Get()
  findAll() {
    return this.logArquivoImportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logArquivoImportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogArquivoImportDto: UpdateLogArquivoImportDto) {
    return this.logArquivoImportService.update(+id, updateLogArquivoImportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logArquivoImportService.remove(+id);
  }
}
