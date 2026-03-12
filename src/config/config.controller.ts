import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PersonalConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly personalConfigService: PersonalConfigService) {}

  /* @Post()
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.personalConfigService.create(createConfigDto);
  } */

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.personalConfigService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.personalConfigService.findOne(+id);
  }

  @Patch()
  @Roles(Role.ADMIN)
  update(@Body() updateConfigDto: UpdateConfigDto) {
    return this.personalConfigService.update(updateConfigDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.personalConfigService.remove(+id);
  }
}
