import { Module } from '@nestjs/common';
import { CredorService } from './credor.service';
import { CredorController } from './credor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Credor } from './entities/credor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Credor])],
  controllers: [CredorController],
  providers: [CredorService],
  exports: [CredorService],
})
export class CredorModule {}
