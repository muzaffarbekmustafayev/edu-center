import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { Role } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateCourseDto, actorId: string, actorRole: Role) {
    // Agar Teacher bo'lsa, faqat o'ziga biriktirishi mumkin
    const teacherId = actorRole === Role.TEACHER ? actorId : dto.teacherId;

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        price: dto.price,
        lessonCount: dto.lessonCount || 12,
        description: dto.description || null,
        teacherId,
      },
      include: {
        teacher: { select: { id: true, name: true, phone: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'course.create',
      entity: 'Course',
      entityId: course.id,
      after: course,
    });

    return course;
  }

  async findAll(actorId: string, actorRole: Role, search?: string) {
    const where: any = { isActive: true };

    // Teacher faqat o'z kurslarini ko'radi
    if (actorRole === Role.TEACHER) {
      where.teacherId = actorId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { groups: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actorId?: string, actorRole?: Role) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, phone: true } },
        groups: { select: { id: true, name: true, status: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Kurs topilmadi');
    }

    // Row-level tekshiruv
    if (actorRole === Role.TEACHER && course.teacherId !== actorId) {
      throw new ForbiddenException('Bu kursga kirish huquqingiz yo‘q');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto, actorId: string, actorRole: Role) {
    const existing = await this.findOne(id, actorId, actorRole);

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        lessonCount: dto.lessonCount,
        description: dto.description,
        teacherId: actorRole === Role.ADMIN ? dto.teacherId : undefined,
        isActive: dto.isActive,
      },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'course.update',
      entity: 'Course',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, actorId: string, actorRole: Role) {
    const course = await this.findOne(id, actorId, actorRole);

    await this.prisma.course.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'course.deactivate',
      entity: 'Course',
      entityId: id,
      before: course,
    });

    return { success: true, message: 'Kurs faolsizlantirildi' };
  }
}
