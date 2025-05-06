import { Module } from '@nestjs/common';
import { DocProtestoService } from './doc-protesto.service';
import { DocProtestoController } from './doc-protesto.controller';

import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtesto } from './entities/doc-protesto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocProtesto])],
  controllers: [DocProtestoController],
  providers: [DocProtestoService],
})
export class DocProtestoModule {}
