import { Module } from '@nestjs/common';
import { ApresentanteService } from './apresentante.service';
import { ApresentanteController } from './apresentante.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apresentante } from './entities/apresentante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Apresentante])],
  controllers: [ApresentanteController],
  providers: [ApresentanteService],
  exports: [ApresentanteService],
})
export class ApresentanteModule {}
