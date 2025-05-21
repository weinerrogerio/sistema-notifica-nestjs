import { Global, Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/user/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '@app/user/user.module';
import { LogUsersModule } from '@app/log-user/log-users.module';
/* import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core'; */

//moduleo global--> utilizado em todos os modulos
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule.forFeature(jwtConfig),
    //JwtModule.registerAsync(jwtConfig.asProvider()),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            audience: configService.get<string>('jwt.audience'),
            issuer: configService.get<string>('jwt.issuer'),
            expiresIn: `${configService.get<number>('jwt.jwtTtl')}s`,
          },
        };
      },
    }),
    UserModule,
    LogUsersModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    AuthService,
    JwtStrategy,
  ],
  exports: [HashingService, JwtModule, ConfigModule],
})
export class AuthModule {}
