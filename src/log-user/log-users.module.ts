import { Global, Module } from '@nestjs/common';
import { LogUsersService } from './log-users.service';
import { LogUsersController } from './log-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogUser } from './entities/log-user.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LogUser])],
  controllers: [LogUsersController],
  providers: [LogUsersService],
  exports: [LogUsersService],
})
export class LogUsersModule {}
