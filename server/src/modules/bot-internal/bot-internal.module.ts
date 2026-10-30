import { Module } from '@nestjs/common';
import { BotInternalService } from './bot-internal.service.js';
import { BotInternalController } from './bot-internal.controller.js';
import { AttendanceModule } from '../attendance/attendance.module.js';

@Module({
  imports: [AttendanceModule],
  controllers: [BotInternalController],
  providers: [BotInternalService],
  exports: [BotInternalService],
})
export class BotInternalModule {}
