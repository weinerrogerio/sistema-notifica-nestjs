import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserService } from '@app/user/user.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
/*
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    // Assume que o usuário id está em req.user.payload.sub após autenticação JWT
    const userId = req?.['payload']?.sub;
    return this.authService.logout(userId);
  }

  // endpoint para validar token
  @Get('validate')
  async validateToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new Error('Token não fornecido');
    }

    const token = authorization.replace('Bearer ', '');
    return await this.authService.validateToken(token);
  }

  //rota aberta para registro de usuário -- APENAS PARA TESTE
  /* @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    // Forçar role de USER para registro público
    createUserDto.role = Role.USER;
    return this.userService.create(createUserDto);
  } */
}
