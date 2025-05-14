import { Module } from '@nestjs/common';
import { DocProtestoCredorService } from './doc-protesto_credor.service';
import { DocProtestoCredorController } from './doc-protesto_credor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtestoCredor } from './entities/doc-protesto_credor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocProtestoCredor])],
  controllers: [DocProtestoCredorController],
  providers: [DocProtestoCredorService],
  exports: [DocProtestoCredorService],
})
export class DocProtestoCredorModule {}
