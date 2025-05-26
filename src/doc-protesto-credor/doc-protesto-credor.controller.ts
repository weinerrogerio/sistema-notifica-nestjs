import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DocProtestoCredorService } from './doc-protesto-credor.service';
import { CreateDocProtestoCredorDto } from './dto/create-doc-protesto_credor.dto';
import { UpdateDocProtestoCredorDto } from './dto/update-doc-protesto_credor.dto';

@Controller('doc-protesto-credor')
export class DocProtestoCredorController {
  constructor(
    private readonly docProtestoCredorService: DocProtestoCredorService,
  ) {}

  @Post()
  create(@Body() createDocProtestoCredorDto: CreateDocProtestoCredorDto) {
    return this.docProtestoCredorService.create(createDocProtestoCredorDto);
  }

  @Get()
  findAll() {
    return this.docProtestoCredorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.docProtestoCredorService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocProtestoCredorDto: UpdateDocProtestoCredorDto,
  ) {
    return this.docProtestoCredorService.update(
      +id,
      updateDocProtestoCredorDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.docProtestoCredorService.remove(+id);
  }
}
