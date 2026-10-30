import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateParentDto } from './dto/create-parent.dto.js';
import { UpdateParentDto } from './dto/update-parent.dto.js';
import { normalizePhone } from '../../common/utils/phone.util.js';

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateParentDto, actorId?: string) {
    const phone = normalizePhone(dto.phone);

    const existing = await this.prisma.parent.findUnique({
      where: { phone },
    });
    if (existing) {
      throw new ConflictException('Bu telefon raqamli ota-ona allaqachon mavjud');
    }

    const parent = await this.prisma.parent.create({
      data: {
        name: dto.name,
        phone,
        telegramId: dto.telegramId || null,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'parent.create',
      entity: 'Parent',
      entityId: parent.id,
      after: parent,
    });

    return parent;
  }

  async findAll(query: { search?: string; take?: number; skip?: number }) {
    const { search, take = 50, skip = 0 } = query;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          children: {
            where: { deletedAt: null },
            select: { id: true, name: true, phone: true, parentRelation: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.parent.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            enrollments: {
              include: {
                group: { include: { course: true } },
                paymentCycles: {
                  orderBy: { cycleNo: 'desc' },
                  take: 2,
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Ota-ona topilmadi');
    }

    return parent;
  }

  async update(id: string, dto: UpdateParentDto, actorId?: string) {
    const existing = await this.findOne(id);
    const data: any = {};

    if (dto.name) data.name = dto.name;
    if (dto.telegramId !== undefined) data.telegramId = dto.telegramId || null;

    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      if (phone !== existing.phone) {
        const check = await this.prisma.parent.findUnique({ where: { phone } });
        if (check && check.id !== id) {
          throw new ConflictException('Bu telefon raqam boshqa ota-onada mavjud');
        }
        data.phone = phone;
      }
    }

    const updated = await this.prisma.parent.update({
      where: { id },
      data,
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'parent.update',
      entity: 'Parent',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const parent = await this.findOne(id);

    await this.prisma.parent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'parent.delete',
      entity: 'Parent',
      entityId: id,
      before: parent,
    });

    return { success: true, message: 'Ota-ona o‘chirildi (soft-delete)' };
  }
}
