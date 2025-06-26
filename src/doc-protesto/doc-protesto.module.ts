import { Module } from '@nestjs/common';
import { DocProtestoService } from './doc-protesto.service';
import { DocProtestoController } from './doc-protesto.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtesto } from './entities/doc-protesto.entity';
import { LogNotificacao } from '@app/log-notificacao/entities/log-notificacao.entity';
import { Devedor } from '@app/devedor/entities/devedor.entity';
import { DocProtestoSearchService } from './services/doc-protesto-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocProtesto, LogNotificacao, Devedor])],
  controllers: [DocProtestoController],
  providers: [DocProtestoService, DocProtestoSearchService],
  exports: [DocProtestoService, DocProtestoSearchService],
})
export class DocProtestoModule {}
