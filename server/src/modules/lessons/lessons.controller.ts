import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service.js';
import { CancelLessonDto } from './dto/cancel-lesson.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Lessons (Darslar Kalendari)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Darslar kalendari (sana, guruh, o‘qituvchi bo‘yicha filter)' })
  async findAll(
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupId') groupId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.lessonsService.findAll({
      startDate,
      endDate,
      groupId,
      teacherId,
      actorId,
      actorRole,
    });
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Darsni bekor qilish (sababi bilan farzand va ota-onaga xabar boradi)' })
  async cancelLesson(
    @Param('id') lessonId: string,
    @Body() dto: CancelLessonDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: Role,
  ) {
    return this.lessonsService.cancelLesson(lessonId, dto.reason, actorId, actorRole);
  }
}
