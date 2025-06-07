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
import { CredorService } from './credor.service';
import { CreateCredorDto } from './dto/create-credor.dto';
import { UpdateCredorDto } from './dto/update-credor.dto';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('credor')
export class CredorController {
  constructor(private readonly credorService: CredorService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createCredorDto: CreateCredorDto) {
    return this.credorService.create(createCredorDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.credorService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.credorService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateCredorDto: UpdateCredorDto) {
    return this.credorService.update(+id, updateCredorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.credorService.remove(+id);
  }
}
