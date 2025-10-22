import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthTokenGuard } from '@app/auth/guards/auth-token.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { TokenPayloadParam } from '@app/auth/params/token-payload.param';
import { TokenPayloadDto } from '@app/auth/dto/token-payload.dto';

@UseGuards(AuthTokenGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN) // Apenas administradores podem criar novos usuários
  create(
    @Body() createUserDto: CreateUserDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    console.log('🔍 TokenPayload recebido:', tokenPayload);
    console.log('🔍 TokenPayload.sub (ID do admin):', tokenPayload?.sub);
    console.log('🔍 TokenPayload.sessionId:', tokenPayload?.sessionId);
    return this.userService.create(createUserDto, tokenPayload);
  }

  //lista todos os usuários que estao ativos
  @Get()
  @Roles(Role.ADMIN) // Apenas administradores podem listar todos os usuários
  findAll() {
    return this.userService.findAll();
  }

  //lista todos os usuários (ativos e inativos)
  @Get('all')
  @Roles(Role.ADMIN) // Apenas administradores podem listar todos os usuários
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  // Usuários comuns e administradores podem ver detalhes - usuário comum so pode ver seus detalhes
  @Roles(Role.USER, Role.ADMIN)
  async findOne(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.userService.findOne(+id, tokenPayload);
  }

  @Patch(':id')
  @Roles(Role.ADMIN) // Apenas administradores podem atualizar usuários
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    console.log('📍 Controller - TokenPayload recebido:', tokenPayload);
    if (!tokenPayload || !tokenPayload.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    return this.userService.update(+id, updateUserDto, tokenPayload);
  }

  //"DELETA" um usuario --> desativa o usuário
  @Delete(':id')
  @Roles(Role.ADMIN) // Apenas administradores podem excluir usuários
  remove(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.userService.remove(+id, tokenPayload);
  }

  //Reativa um usuário
  @Patch('reactivate/:id')
  @Roles(Role.ADMIN) // Apenas administradores podem reativar usuários
  reactivate(
    @Param('id') id: string,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.userService.updateReactivateUser(+id, tokenPayload);
  }
}
