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
import { LogArquivoImportService } from './log-arquivo-import.service';
import { CreateLogArquivoImportDto } from './dto/create-log-arquivo-import.dto';
import { UpdateLogArquivoImportDto } from './dto/update-log-arquivo-import.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-arquivo-import')
export class LogArquivoImportController {
  constructor(
    private readonly logArquivoImportService: LogArquivoImportService,
  ) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createLogArquivoImportDto: CreateLogArquivoImportDto) {
    return this.logArquivoImportService.create(createLogArquivoImportDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.logArquivoImportService.findAll();
  }

  @Get('all-and-user')
  @Roles(Role.USER, Role.ADMIN)
  findAllAndUser() {
    return this.logArquivoImportService.findAllAndUser();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.logArquivoImportService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.USER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateLogArquivoImportDto: UpdateLogArquivoImportDto,
  ) {
    return this.logArquivoImportService.update(+id, updateLogArquivoImportDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.logArquivoImportService.remove(+id);
  }
}
