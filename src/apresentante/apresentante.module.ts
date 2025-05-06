import { Module } from '@nestjs/common';
import { ApresentanteService } from './apresentante.service';
import { ApresentanteController } from './apresentante.controller';

@Module({
  controllers: [ApresentanteController],
  providers: [ApresentanteService],
})
export class ApresentanteModule {}
