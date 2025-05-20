import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { LogEventAdminUserService } from './log_event_admin_user.service';
import { CreateLogEventAdminUserDto } from './dto/create-log_event_admin_user.dto';

@Controller('log-event-admin-user')
export class LogEventAdminUserController {
  constructor(
    private readonly logEventAdminUserService: LogEventAdminUserService,
  ) {}

  @Post()
  create(@Body() createLogEventAdminUserDto: CreateLogEventAdminUserDto) {
    return this.logEventAdminUserService.create(createLogEventAdminUserDto);
  }

  @Get()
  findAll() {
    return this.logEventAdminUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.logEventAdminUserService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logEventAdminUserService.remove(+id);
  }
}
