import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Payments (To‘lovlar)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Oldindan to‘lovni qabul qilish (Faqat Admin)' })
  async create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.paymentsService.create(dto, actorId);
  }

  @Get('debtors')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'To‘lov muddati kelgan yoki kechikkan qarzdorlar ro‘yxati' })
  async getDebtors() {
    return this.paymentsService.getDebtors();
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Barcha qabul qilingan to‘lovlar tarixi' })
  async findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.paymentsService.findAll({
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }
}
