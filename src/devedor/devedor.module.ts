import { Module } from '@nestjs/common';
import { DevedorController } from './devedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';
import { DevedorService } from './devedor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Devedor])],
  controllers: [DevedorController],
  providers: [DevedorService],
  exports: [DevedorService],
})
export class DevedorModule {}
