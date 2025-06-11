import { Module } from '@nestjs/common';
import { ScheduleModuleService } from './schedule-module.service';
import { ScheduleModuleController } from './schedule-module.controller';

@Module({
  controllers: [ScheduleModuleController],
  providers: [ScheduleModuleService],
})
export class ScheduleModuleModule {}
