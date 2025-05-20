import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
  Request,
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
    console.log('findAll', Role.ADMIN);
    return this.userService.findAll();
  }

  @Get(':id')
  // Usuários comuns e administradores podem ver detalhes - usuário comum so pode ver seus detalhes
  @Roles(Role.USER, Role.ADMIN)
  async findOne(@Param('id') id: string, @Request() req) {
    // Obtém o payload do token JWT
    const userPayload = req.REQUEST_TOKEN_PAYLOAD_KEY;

    // Importante: Verifique se o payload está no formato correto
    // Se você não corrigiu o formato do token, pode ser necessário acessar userPayload.payload
    const userRole = userPayload.role;
    const userId = userPayload.sub;

    // Se for admin, pode acessar qualquer usuário
    if (userRole === Role.ADMIN) {
      return this.userService.findOne(+id);
    }

    // Se for usuário comum, só pode ver seus próprios dados
    if (userId === +id) {
      return this.userService.findOne(+id);
    }

    // Caso contrário, não tem permissão
    throw new ForbiddenException(
      'Você não tem permissão para acessar os dados de outro usuário',
    );
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
