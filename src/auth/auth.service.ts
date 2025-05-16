import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from '@app/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from './hashing/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';

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
    /* private readonly jwtService: JwtService, */
  ) {}
  async login(loginDto: LoginDto) {
    //let passwordIsValid = false;
    //let throwError = true;
    const user = await this.user.findOneBy({ nome: loginDto.nome });

    if (!user) {
      throw new UnauthorizedException('user não autorizado');
    }

    //checar senha - se correto retorna true
    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    //depois fazer o token e entregar para o susuário
    return { message: 'Login efetuado com sucesso' };
  }
}
