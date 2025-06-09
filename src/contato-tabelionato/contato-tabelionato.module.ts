import { Module } from '@nestjs/common';
import { ContatoTabelionatoService } from './contato-tabelionato.service';
import { ContatoTabelionatoController } from './contato-tabelionato.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContatoTabelionato } from './entities/contato-tabelionato.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContatoTabelionato])],
  controllers: [ContatoTabelionatoController],
  providers: [ContatoTabelionatoService],
  exports: [ContatoTabelionatoService],
})
export class ContatoTabelionatoModule {}
