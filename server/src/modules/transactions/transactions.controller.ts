import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role, TxType } from '@prisma/client';

@ApiTags('Transactions (Kirim va Chiqim)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Kirim yoki Chiqim tranzaksiyasini kiritish (Faqat Admin)' })
  async create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.transactionsService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha kirim va chiqimlar ro‘yxati (Faqat Admin)' })
  async findAll(
    @Query('type') type?: TxType,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.transactionsService.findAll({
      type,
      category,
      startDate,
      endDate,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tranzaksiya tafsilotlari' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}
