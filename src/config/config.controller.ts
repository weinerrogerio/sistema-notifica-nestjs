import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { PersonalConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Controller('config')
export class ConfigController {
  constructor(private readonly personalConfigService: PersonalConfigService) {}

  /* @Post()
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.personalConfigService.create(createConfigDto);
  } */

  @Get()
  findAll() {
    return this.personalConfigService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personalConfigService.findOne(+id);
  }
  /* 
  @Patch(':id')
  update(@Param('id') id: '1', @Body() updateConfigDto: UpdateConfigDto) {
    return this.personalConfigService.update(+id, updateConfigDto);
  } */
  @Patch()
  update(@Body() updateConfigDto: UpdateConfigDto) {
    return this.personalConfigService.update(updateConfigDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personalConfigService.remove(+id);
  }
}
