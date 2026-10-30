import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { normalizePhone } from '../../common/utils/phone.util.js';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateUserDto, actorId?: string) {
    const phone = normalizePhone(dto.phone);

    const existingPhone = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new ConflictException('Ushbu telefon raqamli xodim allaqachon mavjud');
    }

    if (dto.telegramId) {
      const existingTg = await this.prisma.user.findUnique({
        where: { telegramId: dto.telegramId },
      });
      if (existingTg) {
        throw new ConflictException('Ushbu Telegram ID boshqa xodimga biriktirilgan');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone,
        email: dto.email,
        passwordHash,
        role: dto.role,
        telegramId: dto.telegramId || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        telegramId: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'user.create',
      entity: 'User',
      entityId: user.id,
      after: user,
    });

    return user;
  }

  async findAll(query: { search?: string; role?: Role; isActive?: boolean; take?: number; skip?: number }) {
    const { search, role, isActive, take = 50, skip = 0 } = query;
    const where: any = { deletedAt: null };

    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          telegramId: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { groups: true, courses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        telegramId: true,
        isActive: true,
        createdAt: true,
        courses: { select: { id: true, name: true, price: true } },
        groups: { select: { id: true, name: true, status: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const existing = await this.findOne(id);

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.telegramId !== undefined) data.telegramId = dto.telegramId || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      if (phone !== existing.phone) {
        const check = await this.prisma.user.findUnique({ where: { phone } });
        if (check && check.id !== id) {
          throw new ConflictException('Bu telefon raqam boshqa xodimda mavjud');
        }
        data.phone = phone;
      }
    }

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        telegramId: true,
        isActive: true,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'user.update',
      entity: 'User',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const user = await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'user.delete',
      entity: 'User',
      entityId: id,
      before: user,
    });

    return { success: true, message: 'Xodim muvaffaqiyatli o‘chirildi (soft-delete)' };
  }
}
