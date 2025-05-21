import { Module } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { LogUsersController } from './log-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogUser } from './entities/log-user.entity';
import { UserModule } from '@app/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogUser]), UserModule],
  controllers: [LogUsersController],
  providers: [LogUsersService],
  exports: [LogUsersService],
})
export class LogUsersModule {}
