import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherService } from './teacher.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Teacher Web Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'O‘qituvchi boshqaruv paneli asosiy ko‘rsatkichlari' })
  async getDashboard(@CurrentUser('id') teacherId: string) {
    return this.teacherService.getDashboard(teacherId);
  }

  @Get('groups')
  @ApiOperation({ summary: 'O‘qituvchining barcha faol guruhlari ro‘yxati' })
  async getMyGroups(@CurrentUser('id') teacherId: string) {
    return this.teacherService.getMyGroups(teacherId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Guruh ichidagi o‘quvchilar ro‘yxati va holatlari' })
  async getGroupDetail(
    @CurrentUser('id') teacherId: string,
    @Param('id') groupId: string,
  ) {
    return this.teacherService.getGroupDetail(teacherId, groupId);
  }

  @Get('groups/:groupId/students/:studentId')
  @ApiOperation({ summary: 'O‘quvchi tafsilotlari, ota-onasi va to‘liq davomat tarixi' })
  async getStudentAttendanceHistory(
    @CurrentUser('id') teacherId: string,
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.teacherService.getStudentAttendanceHistory(
      teacherId,
      groupId,
      studentId,
    );
  }
}
