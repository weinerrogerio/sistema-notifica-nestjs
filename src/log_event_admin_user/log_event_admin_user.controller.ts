import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LogEventAdminUserService } from './log_event_admin_user.service';
import { CreateLogEventAdminUserDto } from './dto/create-log_event_admin_user.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-event-admin-user')
export class LogEventAdminUserController {
  constructor(
    private readonly logEventAdminUserService: LogEventAdminUserService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createLogEventAdminUserDto: CreateLogEventAdminUserDto) {
    return this.logEventAdminUserService.create(createLogEventAdminUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.logEventAdminUserService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.logEventAdminUserService.findOne(+id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.logEventAdminUserService.remove(+id);
  }
}
