import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { LogEventAdminUserModule } from '@app/log_event_admin_user/log_event_admin_user.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LogEventAdminUserModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
