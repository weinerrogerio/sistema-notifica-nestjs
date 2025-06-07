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
import { DocProtestoService } from './doc-protesto.service';
import { CreateDocProtestoDto } from './dto/create-doc-protesto.dto';
import { UpdateDocProtestoDto } from './dto/update-doc-protesto.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('doc-protesto')
export class DocProtestoController {
  constructor(private readonly docProtestoService: DocProtestoService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createDocProtestoDto: CreateDocProtestoDto) {
    return this.docProtestoService.create(createDocProtestoDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.docProtestoService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.docProtestoService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDocProtestoDto: UpdateDocProtestoDto,
  ) {
    return this.docProtestoService.update(+id, updateDocProtestoDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.docProtestoService.remove(+id);
  }
}
