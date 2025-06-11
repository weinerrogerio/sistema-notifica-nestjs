import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { CreateLogUserDto } from './dto/create-log-user.dto';
import { UpdateLogUserDto } from './dto/update-log-user.dto';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { LogUser } from './entities/log-user.entity';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('log-users')
export class LogUsersController {
  constructor(private readonly logUsersService: LogUsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createLogUserDto: CreateLogUserDto): Promise<LogUser> {
    return this.logUsersService.create(createLogUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<LogUser[]> {
    return this.logUsersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(@Param('id') id: string): Promise<LogUser> {
    return this.logUsersService.findOne(+id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateLogUserDto: UpdateLogUserDto,
  ): Promise<LogUser> {
    return this.logUsersService.update(+id, updateLogUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.logUsersService.remove(+id);
  }
}
