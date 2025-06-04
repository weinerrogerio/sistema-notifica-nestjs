import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CredorService } from './credor.service';
import { CreateCredorDto } from './dto/create-credor.dto';
import { UpdateCredorDto } from './dto/update-credor.dto';

@Controller('credor')
export class CredorController {
  constructor(private readonly credorService: CredorService) {}

  @Post()
  create(@Body() createCredorDto: CreateCredorDto) {
    return this.credorService.create(createCredorDto);
  }

  @Get()
  findAll() {
    return this.credorService.findAll();
  }

  @Get('teste')
  teste() {
    return this.credorService.teste();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.credorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCredorDto: UpdateCredorDto) {
    return this.credorService.update(+id, updateCredorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.credorService.remove(+id);
  }
}
