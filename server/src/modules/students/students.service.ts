import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { normalizePhone } from '../../common/utils/phone.util.js';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateStudentDto, actorId?: string) {
    const phone = normalizePhone(dto.phone);

    const existing = await this.prisma.student.findUnique({
      where: { phone },
    });
    if (existing) {
      throw new ConflictException('Bu telefon raqamli o‘quvchi allaqachon mavjud');
    }

    let parentId = dto.parentId;

    // Agar parentId berilmagan, lekin parentPhone berilgan bo'lsa
    if (!parentId && dto.parentPhone) {
      const parentPhone = normalizePhone(dto.parentPhone);
      let parent = await this.prisma.parent.findUnique({
        where: { phone: parentPhone },
      });

      if (!parent) {
        parent = await this.prisma.parent.create({
          data: {
            phone: parentPhone,
            name: dto.parentName || 'Ota-ona',
          },
        });
      }
      parentId = parent.id;
    }

    const student = await this.prisma.student.create({
      data: {
        name: dto.name,
        phone,
        telegramId: dto.telegramId || null,
        parentId: parentId || null,
        parentRelation: dto.parentRelation || null,
        status: dto.status || StudentStatus.ACTIVE,
      },
      include: {
        parent: true,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'student.create',
      entity: 'Student',
      entityId: student.id,
      after: student,
    });

    return student;
  }

  async findAll(query: { search?: string; status?: StudentStatus; groupId?: string; take?: number; skip?: number }) {
    const { search, status, groupId, take = 50, skip = 0 } = query;
    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (groupId) {
      where.enrollments = {
        some: { groupId },
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          parent: { select: { id: true, name: true, phone: true, telegramId: true } },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { group: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        enrollments: {
          include: {
            group: { include: { course: true } },
            paymentCycles: {
              orderBy: { cycleNo: 'desc' },
              include: { payments: true },
            },
          },
        },
        attendances: {
          orderBy: { markedAt: 'desc' },
          take: 20,
          include: { lesson: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('O‘quvchi topilmadi');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto, actorId?: string) {
    const existing = await this.findOne(id);
    const data: any = {};

    if (dto.name) data.name = dto.name;
    if (dto.telegramId !== undefined) data.telegramId = dto.telegramId || null;
    if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
    if (dto.parentRelation !== undefined) data.parentRelation = dto.parentRelation || null;
    if (dto.status) data.status = dto.status;

    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      if (phone !== existing.phone) {
        const check = await this.prisma.student.findUnique({ where: { phone } });
        if (check && check.id !== id) {
          throw new ConflictException('Bu telefon raqamli o‘quvchi allaqachon mavjud');
        }
        data.phone = phone;
      }
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data,
      include: { parent: true },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'student.update',
      entity: 'Student',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const student = await this.findOne(id);

    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), status: StudentStatus.INACTIVE },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'student.delete',
      entity: 'Student',
      entityId: id,
      before: student,
    });

    return { success: true, message: 'O‘quvchi o‘chirildi (soft-delete)' };
  }
}
