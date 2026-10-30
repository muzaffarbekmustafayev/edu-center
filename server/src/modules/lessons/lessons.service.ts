import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import {
  Role,
  LessonStatus,
  NotificationType,
  RecipientType,
  EnrollmentStatus,
} from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: {
    startDate?: string;
    endDate?: string;
    groupId?: string;
    teacherId?: string;
    actorId?: string;
    actorRole?: Role;
  }) {
    const { startDate, endDate, groupId, teacherId, actorId, actorRole } = query;
    const where: any = {};

    if (actorRole === Role.TEACHER) {
      where.group = { teacherId: actorId };
    } else if (teacherId) {
      where.group = { teacherId };
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate);
      if (endDate) where.scheduledAt.lte = new Date(endDate);
    }

    return this.prisma.lesson.findMany({
      where,
      include: {
        group: {
          include: {
            course: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async cancelLesson(
    lessonId: string,
    reason: string,
    actorId: string,
    actorRole: Role,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            course: true,
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              include: {
                student: { include: { parent: true } },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Dars topilmadi');
    }

    if (actorRole === Role.TEACHER && lesson.group.teacherId !== actorId) {
      throw new ForbiddenException('Bu darsni bekor qilishga ruxsatingiz yo‘q');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: LessonStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    const lessonTime = new Date(lesson.scheduledAt).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    });

    // Barcha o'quvchilar va ularning mas'ul ota-onalariga xabar
    const message =
      `⚠️ <b>Dars bekor qilindi</b>\n\n` +
      `Bugun soat ${lessonTime} dagi "<b>${lesson.group.course.name}</b>" darsi qoldirildi.\n` +
      `📝 Sabab: <i>${reason}</i>\n\n` +
      `Ushbu dars bekor qilingani sababli darslar balansingizdan yechilmaydi.`;

    for (const enrollment of lesson.group.enrollments) {
      const student = enrollment.student;

      if (student.telegramId) {
        await this.notificationsService.send({
          recipientType: RecipientType.STUDENT,
          recipientId: student.id,
          telegramId: student.telegramId,
          type: NotificationType.LESSON_CANCELLED,
          refId: `cancel_${lessonId}_${student.id}`,
          content: message,
        });
      }

      if (student.parent && student.parent.telegramId) {
        await this.notificationsService.send({
          recipientType: RecipientType.PARENT,
          recipientId: student.parent.id,
          telegramId: student.parent.telegramId,
          type: NotificationType.LESSON_CANCELLED,
          refId: `cancel_${lessonId}_parent_${student.parent.id}`,
          content: message,
        });
      }
    }

    await this.auditLogService.log({
      actorId,
      actorRole,
      action: 'lesson.cancel',
      entity: 'Lesson',
      entityId: lessonId,
      after: { reason },
    });

    return updated;
  }
}
