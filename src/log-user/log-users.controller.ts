import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-users')
export class LogUsersController {
  constructor(private readonly logUsersService: LogUsersService) {}

  @Post()
  @Roles(Role.USER, Role.ADMIN)
  create(@Body() createLogUserDto: CreateLogUserDto) {
    return this.logUsersService.create(createLogUserDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  findAll() {
    return this.logUsersService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.logUsersService.findOne(+id);
  }
}
