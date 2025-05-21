import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { CreateLogUserDto } from './dto/create-log-user.dto';

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
}
