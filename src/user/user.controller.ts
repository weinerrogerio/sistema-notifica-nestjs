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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { RolesGuard } from '@app/auth/guards/roles.guard';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN) // Apenas administradores podem criar novos usuários
  create(@Body() createUserDto: CreateUserDto) {
    console.log('create');
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN) // Apenas administradores podem listar todos os usuários
  findAll() {
    return this.userService.findAll();
  }

  // Rota pública para auto-registro de novos usuários
  /* @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    console.log('register');
    // Forçar role de USER para registro público
    createUserDto.role = Role.USER;
    return this.userService.create(createUserDto);
  } */

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN) // Usuários comuns e administradores podem ver detalhes - usuário comum so pode ver seus detalhes
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Apenas administradores podem atualizar usuários
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log(updateUserDto);
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Apenas administradores podem excluir usuários
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
