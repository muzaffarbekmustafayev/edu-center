import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { TxType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateTransactionDto, actorId: string) {
    const transaction = await this.prisma.transaction.create({
      data: {
        type: dto.type,
        category: dto.category,
        amount: dto.amount,
        note: dto.note || null,
        date: dto.date ? new Date(dto.date) : new Date(),
        createdBy: actorId,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'transaction.create',
      entity: 'Transaction',
      entityId: transaction.id,
      after: transaction,
    });

    return transaction;
  }

  async findAll(query: {
    type?: TxType;
    category?: string;
    startDate?: string;
    endDate?: string;
    take?: number;
    skip?: number;
  }) {
    const { type, category, startDate, endDate, take = 50, skip = 0 } = query;
    const where: any = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take,
        skip,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Tranzaksiya topilmadi');
    }
    return transaction;
  }
}
