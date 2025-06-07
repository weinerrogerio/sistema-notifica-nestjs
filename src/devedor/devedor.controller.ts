import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DevedorService } from './devedor.service';
import { CreateDevedorDto } from './dto/create-devedor.dto';
import { UpdateDevedorDto } from './dto/update-devedor.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('devedor')
export class DevedorController {
  constructor(private readonly devedorService: DevedorService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createDevedorDto: CreateDevedorDto) {
    return this.devedorService.create(createDevedorDto);
  }

  @Get('teste-update-email')
  @Roles(Role.USER, Role.ADMIN)
  findAllWithEmailNull() {
    return this.devedorService.updateAllEmailTeste();
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('pj')
  findAll() {
    return this.devedorService.findOneAllByPj();
  }

  // endpoint para buscar email a partir do cnpj:
  @Get('emails')
  @Roles(Role.USER, Role.ADMIN)
  async buscarEmails() {
    try {
      const resultado = await this.devedorService.buscarEmailsDevedores();

      return {
        success: true,
        data: resultado,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar emails',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.devedorService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateDevedorDto: UpdateDevedorDto) {
    return this.devedorService.update(+id, updateDevedorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.devedorService.remove(+id);
  }
}
