import { Module } from '@nestjs/common';
import { ContatoTabelionatoService } from './contato-tabelionato.service';
import { ContatoTabelionatoController } from './contato-tabelionato.controller';

@Module({
  controllers: [ContatoTabelionatoController],
  providers: [ContatoTabelionatoService],
})
export class ContatoTabelionatoModule {}
