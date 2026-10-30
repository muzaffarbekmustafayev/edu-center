import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { ParentsModule } from './modules/parents/parents.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { TransactionsModule } from './modules/transactions/transactions.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { TeacherModule } from './modules/teacher/teacher.module.js';
import { BotInternalModule } from './modules/bot-internal/bot-internal.module.js';
import { SchedulerModule } from './modules/scheduler/scheduler.module.js';

@Module({
  imports: [
    // 1. Konfiguratsiya va tizim modullari
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // 2. Ma'lumotlar bazasi va global servislar
    PrismaModule,
    AuditLogModule,
    NotificationsModule,

    // 3. Biznes modullari
    AuthModule,
    UsersModule,
    StudentsModule,
    ParentsModule,
    CoursesModule,
    GroupsModule,
    LessonsModule,
    AttendanceModule,
    PaymentsModule,
    TransactionsModule,
    ReportsModule,
    TeacherModule,
    BotInternalModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
