import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from '@app/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from './hashing/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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
  ) {}
  async login(loginDto: LoginDto) {
    const user = await this.user.findOneBy({ nome: loginDto.nome });

    if (!user) {
      throw new UnauthorizedException('user não autorizado');
    }

    const passwordIsValid = await this.hashingService.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Senha inválida');
    }

    // Assinando o token - não precisa passar as opções novamente
    // pois já foram configuradas no módulo
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      name: user.nome,
    });

    return { accessToken };
  }
}
