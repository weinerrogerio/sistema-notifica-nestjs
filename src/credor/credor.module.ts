import { Module } from '@nestjs/common';
import { CredorService } from './credor.service';
import { CredorController } from './credor.controller';

@Module({
  controllers: [CredorController],
  providers: [CredorService],
})
export class CredorModule {}
