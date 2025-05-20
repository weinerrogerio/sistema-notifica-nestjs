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
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN) // Apenas administradores podem listar todos os usuários
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  // Usuários comuns e administradores podem ver detalhes - usuário comum so pode ver seus detalhes
  @Roles(Role.USER, Role.ADMIN)
  async findOne(@Param('id') id: string, @Request() req) {
    // Obtém o payload do token JWT
    const userPayload = req.REQUEST_TOKEN_PAYLOAD_KEY;
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
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const userId = req?.['REQUEST_TOKEN_PAYLOAD_KEY']?.sub;
    return this.userService.update(+id, updateUserDto, userId);
  }

  //"DELETA" um usuario --> desativa o usuário
  @Delete(':id')
  @Roles(Role.ADMIN) // Apenas administradores podem excluir usuários
  remove(@Param('id') id: string, @Request() req) {
    const userPayload = req.REQUEST_TOKEN_PAYLOAD_KEY;
    return this.userService.remove(+id, userPayload.sub);
  }

  //Reativa um usuário
  @Patch('reactivate/:id')
  @Roles(Role.ADMIN) // Apenas administradores podem reativar usuários
  reactivate(@Param('id') id: string, @Request() req) {
    const userPayload = req.REQUEST_TOKEN_PAYLOAD_KEY;
    return this.userService.updateReactivateUser(+id, userPayload.sub);
  }
}
