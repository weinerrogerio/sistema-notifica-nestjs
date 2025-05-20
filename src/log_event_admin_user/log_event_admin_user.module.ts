import { Module } from '@nestjs/common';
import { LogEventAdminUserService } from './log_event_admin_user.service';
import { LogEventAdminUserController } from './log_event_admin_user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEventAdminUser } from './entities/log_event_admin_user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEventAdminUser])],
  controllers: [LogEventAdminUserController],
  providers: [LogEventAdminUserService],
  exports: [LogEventAdminUserService],
})
export class LogEventAdminUserModule {}
