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

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createDevedorDto: CreateDevedorDto) {
    return this.devedorService.create(createDevedorDto);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('pj')
  findAll() {
    return this.devedorService.findOneBrPj();
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devedorService.findOne(+id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDevedorDto: UpdateDevedorDto) {
    return this.devedorService.update(+id, updateDevedorDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devedorService.remove(+id);
  }
}
