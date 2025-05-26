import { Module } from '@nestjs/common';
import { DocProtestoCredorService } from './doc-protesto-credor.service';
import { DocProtestoCredorController } from './doc-protesto-credor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocProtestoCredor } from './entities/doc-protesto-credor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocProtestoCredor])],
  controllers: [DocProtestoCredorController],
  providers: [DocProtestoCredorService],
  exports: [DocProtestoCredorService],
})
export class DocProtestoCredorModule {}
