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
import { DocProtestoCredorService } from './doc-protesto-credor.service';
import { CreateDocProtestoCredorDto } from './dto/create-doc-protesto_credor.dto';
import { UpdateDocProtestoCredorDto } from './dto/update-doc-protesto_credor.dto';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('doc-protesto-credor')
export class DocProtestoCredorController {
  constructor(
    private readonly docProtestoCredorService: DocProtestoCredorService,
  ) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createDocProtestoCredorDto: CreateDocProtestoCredorDto) {
    return this.docProtestoCredorService.create(createDocProtestoCredorDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.docProtestoCredorService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.docProtestoCredorService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.docProtestoCredorService.remove(+id);
  }
}
