import { Module } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { LogUsersController } from './log-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogUser } from './entities/log-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogUser])],
  controllers: [LogUsersController],
  providers: [LogUsersService],
})
export class LogUsersModule {}
