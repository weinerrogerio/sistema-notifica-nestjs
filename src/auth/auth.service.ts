import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from '@app/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from './hashing/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LogUsersService } from '@app/log-users/log-users.service';

@Injectable()
export class AuthService {
  //puxando dados de user para fazer a tenticação
  // duas maneiras --> com o repositoty de user (serviçe)
  // ou com o DTO de user  (entiity) <-- usamos essa
  constructor(
    @InjectRepository(User)
    private readonly user: Repository<User>,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
    private readonly logUsersService: LogUsersService,
  ) {}
  async login(loginDto: LoginDto) {
    const user = await this.user.findOneBy({ nome: loginDto.nome });
    // verificando se o user existe
    if (!user) {
      throw new UnauthorizedException('Credenciais Inválidas');
    }
    // Atualiza o último login --> modificar userService para logUserService !!!
    //await this.userService.updateLastLogin(user.id);

    // verificando se a senha esta correta
    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!passwordIsValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    await this.logUsersService.createLoginEntry(user.id);

    // Incluindo role no payload do JWT
    const payload = {
      sub: user.id,
      name: user.nome,
      role: user.role,
    };

    // Assinando o token
    const accessToken = await this.jwtService.signAsync(payload);

    // retorna o token
    return { accessToken };
  }

  async logout(userId: number) {
    // Atualiza o registro de login com a data de logout
    await this.logUsersService.updateLogoutEntry(userId);
    return { message: 'Logout realizado com sucesso' };
  }
}
