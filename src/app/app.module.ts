import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImportModule } from 'src/import/import.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtestoModule } from 'src/doc-protesto/doc-protesto.module';
import { UserModule } from 'src/user/user.module';
import { LogUsersModule } from 'src/log-users/log-users.module';
import { DevedorModule } from 'src/devedor/devedor.module';
import { LogNotificacaoModule } from 'src/log-notificacao/log-notificacao.module';

@Module({
  imports: [
    ImportModule,
    //ATENÇÃO INSERIR DADOS DE ACESSO DO BANCO - CUIDADO
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      database: 'sistema_notifica',
      password: '499178',
      autoLoadEntities: true, // carrega entidades sem precisar importar em cada modulo (especifica-las)
      //NÃO USAR EM PRODUÇÃO - RETIRAR (FALSE) SINCRONIZAÇÃO NO DEPLOY
      synchronize: true, //sincroniza as entidades com o banco de dados
    }),
    DocProtestoModule,
    DevedorModule,
    LogNotificacaoModule,
    UserModule,
    LogUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
