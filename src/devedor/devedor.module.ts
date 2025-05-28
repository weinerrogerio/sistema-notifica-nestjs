import { Module } from '@nestjs/common';
import { DevedorController } from './devedor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Devedor } from './entities/devedor.entity';
import { DevedorService } from './devedor.service';
import { EmailLookupModule } from '@app/email-lookup/email-lookup.module';

@Module({
  imports: [TypeOrmModule.forFeature([Devedor]), EmailLookupModule],
  controllers: [DevedorController],
  providers: [DevedorService],
  exports: [DevedorService],
})
export class DevedorModule {}
