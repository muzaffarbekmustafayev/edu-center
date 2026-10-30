import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  LinkTelegramDto,
  RegisterStudentWithParentDto,
} from './dto/internal-auth.dto.js';
import { InternalApiKeyGuard } from '../../common/guards/internal-api-key.guard.js';

@ApiTags('Internal Bot Auth')
@ApiSecurity('InternalKey')
@UseGuards(InternalApiKeyGuard)
@Controller('internal/auth')
export class InternalAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check-user/:telegramId')
  @ApiOperation({ summary: 'Telegram ID bo‘yicha O‘qituvchi, O‘quvchi yoki Ota-onani tekshirish' })
  async checkUserByTelegramId(@Param('telegramId') telegramId: string) {
    return this.authService.checkUserByTelegramId(telegramId);
  }

  @Post('link-telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telefon raqam bo‘yicha Telegram ID ni bog‘lash' })
  async linkTelegram(@Body() dto: LinkTelegramDto) {
    return this.authService.linkTelegram(dto);
  }

  @Post('register-student-with-parent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bot orqali yangi o‘quvchini bitta mas‘ul ota-ona bilan birga ro‘yxatga olish' })
  async registerStudentWithParent(@Body() dto: RegisterStudentWithParentDto) {
    return this.authService.registerStudentWithParent(dto);
  }
}
