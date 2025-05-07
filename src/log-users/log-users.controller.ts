import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';

@Controller('log-users')
export class LogUsersController {
  constructor(private readonly logUsersService: LogUsersService) {}

  @Post()
  create(@Body() createLogUserDto: CreateLogUserDto) {
    return this.logUsersService.create(createLogUserDto);
  }

  @Get()
  findAll() {
    return this.logUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logUsersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLogUserDto: UpdateLogUserDto) {
    return this.logUsersService.update(+id, updateLogUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logUsersService.remove(+id);
  }
}
