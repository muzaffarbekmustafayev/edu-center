import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role, MarkedVia } from '@prisma/client';

@ApiTags('Attendance (Davomat)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('lessons/:lessonId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Dars bo‘yicha o‘quvchilar va ularning davomat holati' })
  async getLessonAttendance(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.attendanceService.getLessonAttendance(lessonId, actorId, actorRole);
  }

  @Post('lessons/:lessonId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Dars davomatini belgilash / saqlash (Veb fallback)' })
  async markAttendance(
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.attendanceService.markAttendance(
      lessonId,
      dto,
      actorId,
      actorRole,
      MarkedVia.WEB,
    );
  }
}
