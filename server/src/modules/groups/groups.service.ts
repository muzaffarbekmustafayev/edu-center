import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { Role, GroupStatus, EnrollmentStatus, LessonStatus } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateGroupDto, actorId: string, actorRole: Role) {
    const teacherId = actorRole === Role.TEACHER ? actorId : dto.teacherId;

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        courseId: dto.courseId,
        teacherId,
        room: dto.room || null,
        startDate: new Date(dto.startDate),
        durationMin: dto.durationMin || 90,
        schedules: {
          create: dto.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            durationMin: s.durationMin || dto.durationMin || 90,
          })),
        },
      },
      include: {
        schedules: true,
        course: true,
        teacher: { select: { id: true, name: true, phone: true } },
      },
    });

    // 90 kunlik darslarni oldindan generatsiya qilish
    await this.generateLessonsForGroup(group.id, new Date(dto.startDate), 90);

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'group.create',
      entity: 'Group',
      entityId: group.id,
      after: group,
    });

    return group;
  }

  async findAll(actorId: string, actorRole: Role, search?: string) {
    const where: any = { deletedAt: null };

    if (actorRole === Role.TEACHER) {
      where.teacherId = actorId;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const groups = await this.prisma.group.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, price: true } },
        teacher: { select: { id: true, name: true, phone: true } },
        schedules: true,
        _count: {
          select: {
            enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
          },
        },
        lessons: {
          where: {
            scheduledAt: { gte: todayStart, lte: todayEnd },
            status: { not: LessonStatus.CANCELLED },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      courseId: g.courseId,
      courseName: g.course.name,
      coursePrice: g.course.price,
      teacherId: g.teacherId,
      teacherName: g.teacher.name,
      room: g.room,
      startDate: g.startDate,
      durationMin: g.durationMin,
      status: g.status,
      studentCount: g._count.enrollments,
      hasLessonToday: g.lessons.length > 0,
      schedules: g.schedules,
    }));
  }

  async findOne(id: string, actorId?: string, actorRole?: Role) {
    const group = await this.prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: {
        course: true,
        teacher: { select: { id: true, name: true, phone: true } },
        schedules: true,
        enrollments: {
          where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] } },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                parent: { select: { id: true, name: true, phone: true } },
              },
            },
            paymentCycles: {
              orderBy: { cycleNo: 'desc' },
              take: 1,
            },
          },
        },
        lessons: {
          orderBy: { scheduledAt: 'asc' },
          where: { scheduledAt: { gte: new Date() } },
          take: 10,
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi');
    }

    if (actorRole === Role.TEACHER && group.teacherId !== actorId) {
      throw new ForbiddenException('Bu guruhga kirish huquqingiz yo‘q');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto, actorId: string, actorRole: Role) {
    const existing = await this.findOne(id, actorId, actorRole);

    const updated = await this.prisma.group.update({
      where: { id },
      data: {
        name: dto.name,
        courseId: dto.courseId,
        teacherId: actorRole === Role.ADMIN ? dto.teacherId : undefined,
        room: dto.room,
        durationMin: dto.durationMin,
        status: dto.status,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'group.update',
      entity: 'Group',
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, actorId: string, actorRole: Role) {
    const group = await this.findOne(id, actorId, actorRole);

    await this.prisma.group.update({
      where: { id },
      data: { deletedAt: new Date(), status: GroupStatus.ARCHIVED },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'group.delete',
      entity: 'Group',
      entityId: id,
      before: group,
    });

    return { success: true, message: 'Guruh o‘chirildi (soft-delete)' };
  }

  async enrollStudent(groupId: string, studentId: string, actorId: string, actorRole: Role) {
    await this.findOne(groupId, actorId, actorRole);

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });
    if (!student) {
      throw new NotFoundException('O‘quvchi topilmadi');
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_groupId: { studentId, groupId },
      },
    });

    if (existingEnrollment && existingEnrollment.status === EnrollmentStatus.ACTIVE) {
      throw new ConflictException('O‘quvchi ushbu guruhda allaqachon faol a‘zo');
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        studentId_groupId: { studentId, groupId },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
      },
      create: {
        studentId,
        groupId,
        status: EnrollmentStatus.ACTIVE,
        freeLessonsUsed: 0,
        lessonsDone: 0,
        consecutiveAbsences: 0,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'enrollment.create',
      entity: 'Enrollment',
      entityId: enrollment.id,
      after: { studentId, groupId },
    });

    return enrollment;
  }

  async dropStudent(groupId: string, studentId: string, actorId: string, actorRole: Role) {
    await this.findOne(groupId, actorId, actorRole);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_groupId: { studentId, groupId },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('O‘quvchi ushbu guruhga biriktirilmagan');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.DROPPED },
    });

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'enrollment.drop',
      entity: 'Enrollment',
      entityId: enrollment.id,
      before: enrollment,
      after: updated,
    });

    return { success: true, message: 'O‘quvchi guruhdan chiqarildi' };
  }

  /**
   * Jadval asosida berilgan kundan boshlab keyingi N kunlik Lesson yozuvlarini generatsiya qilish
   */
  async generateLessonsForGroup(groupId: string, startDate: Date, days: number = 90) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { schedules: true },
    });

    if (!group || group.schedules.length === 0) return;

    const lessonsToCreate: { groupId: string; scheduledAt: Date }[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const scheduleMap = new Map<number, string[]>();
    for (const s of group.schedules) {
      const times = scheduleMap.get(s.dayOfWeek) || [];
      times.push(s.startTime);
      scheduleMap.set(s.dayOfWeek, times);
    }

    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const jsDay = current.getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

      const startTimes = scheduleMap.get(dayOfWeek);
      if (startTimes && startTimes.length > 0) {
        for (const timeStr of startTimes) {
          const [hours, minutes] = timeStr.split(':').map((num) => parseInt(num, 10));
          const lessonDate = new Date(current);
          lessonDate.setHours(hours, minutes, 0, 0);

          lessonsToCreate.push({
            groupId,
            scheduledAt: lessonDate,
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    for (const item of lessonsToCreate) {
      const exists = await this.prisma.lesson.findFirst({
        where: {
          groupId: item.groupId,
          scheduledAt: item.scheduledAt,
        },
      });

      if (!exists) {
        await this.prisma.lesson.create({
          data: {
            groupId: item.groupId,
            scheduledAt: item.scheduledAt,
            status: LessonStatus.SCHEDULED,
          },
        });
      }
    }
  }
}
