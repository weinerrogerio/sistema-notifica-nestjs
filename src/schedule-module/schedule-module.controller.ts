import { Controller } from '@nestjs/common';
import { ScheduleModuleService } from './schedule-module.service';

@Controller('schedule-module')
export class ScheduleModuleController {
  constructor(private readonly scheduleModuleService: ScheduleModuleService) {}
}
