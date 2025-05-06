import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DocProtestoService } from './doc-protesto.service';
import { CreateDocProtestoDto } from './dto/create-doc-protesto.dto';
import { UpdateDocProtestoDto } from './dto/update-doc-protesto.dto';

@Controller('doc-protesto')
export class DocProtestoController {
  constructor(private readonly docProtestoService: DocProtestoService) {}

  @Post()
  create(@Body() createDocProtestoDto: CreateDocProtestoDto) {
    return this.docProtestoService.create(createDocProtestoDto);
  }

  @Get()
  findAll() {
    return this.docProtestoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.docProtestoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocProtestoDto: UpdateDocProtestoDto) {
    return this.docProtestoService.update(+id, updateDocProtestoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.docProtestoService.remove(+id);
  }
}
