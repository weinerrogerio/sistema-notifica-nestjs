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
import { ApresentanteService } from './apresentante.service';
import { CreateApresentanteDto } from './dto/create-apresentante.dto';
import { UpdateApresentanteDto } from './dto/update-apresentante.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('apresentante')
export class ApresentanteController {
  constructor(private readonly apresentanteService: ApresentanteService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createApresentanteDto: CreateApresentanteDto) {
    return this.apresentanteService.create(createApresentanteDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.apresentanteService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.apresentanteService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateApresentanteDto: UpdateApresentanteDto,
  ) {
    return this.apresentanteService.update(+id, updateApresentanteDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.apresentanteService.remove(+id);
  }
}
