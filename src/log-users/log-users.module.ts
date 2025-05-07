import { Module } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { LogUsersController } from './log-users.controller';

@Module({
  controllers: [LogUsersController],
  providers: [LogUsersService],
})
export class LogUsersModule {}
