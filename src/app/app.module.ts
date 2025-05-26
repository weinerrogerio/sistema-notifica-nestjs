import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImportModule } from 'src/import/import.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtestoModule } from 'src/doc-protesto/doc-protesto.module';
import { UserModule } from 'src/user/user.module';
import { LogUsersModule } from '@app/log-user/log-users.module';
import { DevedorModule } from 'src/devedor/devedor.module';
import { LogNotificacaoModule } from 'src/log-notificacao/log-notificacao.module';
import { DocProtestoCredorModule } from '@app/doc-protesto-credor/doc-protesto-credor.module';
import { CredorModule } from '@app/credor/credor.module';
import { AuthModule } from '@app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { LogEventAdminUserModule } from '@app/log_event_admin_user/log_event_admin_user.module';
import { LogArquivoImportModule } from '@app/log-arquivo-import/log-arquivo-import.module';

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
    DocProtestoCredorModule,
    CredorModule,
    LogNotificacaoModule,
    UserModule,
    LogUsersModule,
    LogEventAdminUserModule,
    LogArquivoImportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
