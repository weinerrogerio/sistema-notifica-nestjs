import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from '@app/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from './hashing/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LogUsersService } from '@app/log-user/log-users.service';

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
    const user = await this.user.findOneBy({
      nome: loginDto.nome,
      is_active: true,
    });
    // verificando se o user existe
    if (!user) {
      throw new UnauthorizedException('User unauthorized');
    }

    // verificando se a senha esta correta
    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!passwordIsValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    // Atualiza o último login --> melhorar essa verificação de logout
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
    return {
      accessToken,
      user: {
        id: user.id,
        nome: user.nome,
        role: user.role,
        email: user.email,
      },
    };
  }

  async logout(userId: number) {
    // Atualiza o registro de login com a data de logout
    await this.logUsersService.updateLogoutEntry(userId);
    return { message: 'Logout realizado com sucesso' };
  }

  //validar token e retornar dados do usuário
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.user.findOneBy({
        id: payload.sub,
        is_active: true,
      });

      if (!user) {
        throw new UnauthorizedException('Token inválido');
      }

      return {
        id: user.id,
        nome: user.nome,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido', error.message);
    }
  }
}
