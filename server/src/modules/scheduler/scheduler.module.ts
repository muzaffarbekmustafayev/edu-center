import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { GroupsModule } from '../groups/groups.module.js';

@Module({
  imports: [GroupsModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class SchedulerModule {}
