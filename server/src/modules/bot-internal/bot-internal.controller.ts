import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { BotInternalService } from './bot-internal.service.js';
import { MarkAttendanceDto } from '../attendance/dto/mark-attendance.dto.js';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard.js';

@ApiTags('Bot Internal API')
@ApiSecurity('InternalKey')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/bot')
export class BotInternalController {
  constructor(private readonly botInternalService: BotInternalService) {}

  @Get('students/balance/:telegramId')
  @ApiOperation({ summary: 'O‘quvchi yoki Ota-ona balansi va qarzi (/balans)' })
  async getBalance(@Param('telegramId') telegramId: string) {
    return this.botInternalService.getBalance(telegramId);
  }

  @Get('students/lessons/:telegramId')
  @ApiOperation({ summary: 'Darslar jadvali va davomat tarixi (/darslar)' })
  async getUpcomingLessons(@Param('telegramId') telegramId: string) {
    return this.botInternalService.getUpcomingLessons(telegramId);
  }

  @Get('teachers/groups/:telegramId')
  @ApiOperation({ summary: 'O‘qituvchining faol guruhlari (/guruhlarim)' })
  async getTeacherGroups(@Param('telegramId') telegramId: string) {
    return this.botInternalService.getTeacherGroups(telegramId);
  }

  @Get('teachers/groups/:telegramId/:groupId')
  @ApiOperation({ summary: 'O‘qituvchi guruhi tafsilotlari' })
  async getTeacherGroupDetail(
    @Param('telegramId') telegramId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.botInternalService.getTeacherGroupDetail(telegramId, groupId);
  }

  @Get('teachers/groups/:telegramId/:groupId/students')
  @ApiOperation({ summary: 'Guruh o‘quvchilari ro‘yxati (yo‘qlama tugmalari uchun)' })
  async getGroupStudentsForAttendance(
    @Param('telegramId') telegramId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.botInternalService.getGroupStudentsForAttendance(telegramId, groupId);
  }

  @Post('attendance/finalize/:telegramId/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram bot orqali yo‘qlamani yakunlash va saqlash' })
  async finalizeAttendance(
    @Param('telegramId') telegramId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.botInternalService.finalizeAttendanceFromBot(telegramId, lessonId, dto);
  }
}
