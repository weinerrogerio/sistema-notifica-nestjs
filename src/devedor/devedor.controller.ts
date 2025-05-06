import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DevedorService } from './devedor.service';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';

@Controller('devedor')
export class DevedorController {
  constructor(private readonly devedorService: DevedorService) {}

  @Post()
  create(@Body() createDevedorDto: CreateDevedorDto) {
    return this.devedorService.create(createDevedorDto);
  }

  @Get()
  findAll() {
    return this.devedorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devedorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDevedorDto: UpdateDevedorDto) {
    return this.devedorService.update(+id, updateDevedorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devedorService.remove(+id);
  }
}
