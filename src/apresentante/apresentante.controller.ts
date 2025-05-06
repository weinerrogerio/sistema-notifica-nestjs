import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApresentanteService } from './apresentante.service';
import { CreateApresentanteDto } from './dto/create-apresentante.dto';
import { UpdateApresentanteDto } from './dto/update-apresentante.dto';

@Controller('apresentante')
export class ApresentanteController {
  constructor(private readonly apresentanteService: ApresentanteService) {}

  @Post()
  create(@Body() createApresentanteDto: CreateApresentanteDto) {
    return this.apresentanteService.create(createApresentanteDto);
  }

  @Get()
  findAll() {
    return this.apresentanteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.apresentanteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApresentanteDto: UpdateApresentanteDto) {
    return this.apresentanteService.update(+id, updateApresentanteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.apresentanteService.remove(+id);
  }
}
