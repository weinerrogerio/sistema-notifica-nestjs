import { Module } from '@nestjs/common';
import { DevedorService } from './devedor.service';
import { DevedorController } from './devedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Devedor])],
  controllers: [DevedorController],
  providers: [DevedorService],
})
export class DevedorModule {}
