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
import { NotificationModule } from '@app/notification/notification.module';

import { TrackingPixelModule } from '@app/tracking/tracking.module';
import { ContatoTabelionatoModule } from '@app/contato-tabelionato/contato-tabelionato.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalQueryFailedExceptionFilter } from '@app/common/filters/query-failed-exception.filter';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupTask } from '@app/schedule-module/cleanup.task';
import { TemplateModule } from '@app/template/template.module';

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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.production', // Arquivo específico do ambiente
        '.env.local', // Arquivo local (se existir)
        '.env', // Arquivo padrão (fallback)
      ],
    }),
    ScheduleModule.forRoot(),
    DocProtestoModule,
    DevedorModule,
    DocProtestoCredorModule,
    CredorModule,
    LogNotificacaoModule,
    UserModule,
    LogUsersModule,
    LogEventAdminUserModule,
    LogArquivoImportModule,
    ContatoTabelionatoModule,
    AuthModule,
    NotificationModule,
    TrackingPixelModule,
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    //FILTROP DE EXCEÇÕES - ERROS
    {
      provide: APP_FILTER,
      useClass: GlobalQueryFailedExceptionFilter,
    },
    CleanupTask,
  ],
})
export class AppModule {}
