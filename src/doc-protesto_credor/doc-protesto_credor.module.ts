import { Module } from '@nestjs/common';
import { DocProtestoCredorService } from './doc-protesto_credor.service';
import { DocProtestoCredorController } from './doc-protesto_credor.controller';

@Module({
  controllers: [DocProtestoCredorController],
  providers: [DocProtestoCredorService],
})
export class DocProtestoCredorModule {}
