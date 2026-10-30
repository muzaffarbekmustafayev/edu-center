import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Reports (Hisobotlar & Dashboard)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin Dashboard umumiy ko‘rsatkichlari' })
  async getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('financial')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Moliyaviy hisobot va kategoriyalar tahlili' })
  async getFinancial(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getFinancial({ startDate, endDate });
  }

  @Get('teacher-revenue')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'O‘qituvchi oylik tushumi (O‘qituvchi o‘zinikini ko‘radi)' })
  async getTeacherRevenue(
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Query('teacherId') teacherIdQuery?: string,
  ) {
    const teacherId = actorRole === Role.ADMIN && teacherIdQuery ? teacherIdQuery : actorId;
    return this.reportsService.getTeacherRevenue(teacherId);
  }
}
