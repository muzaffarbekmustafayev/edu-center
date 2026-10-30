import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import {
  Role,
  AttendanceState,
  MarkedVia,
  NotificationType,
  RecipientType,
  EnrollmentStatus,
  LessonStatus,
  AttendanceStatus,
  PaymentStatus,
} from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async markAttendance(
    lessonId: string,
    dto: MarkAttendanceDto,
    actorId?: string,
    actorRole?: Role,
    markedVia: MarkedVia = MarkedVia.WEB,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            course: true,
            teacher: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Dars topilmadi');
    }

    if (actorRole === Role.TEACHER && lesson.group.teacherId !== actorId) {
      throw new ForbiddenException('Bu dars davomatini belgilashga ruxsatingiz yo‘q');
    }

    const lessonTime = new Date(lesson.scheduledAt).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    });

    const results = [];

    for (const item of dto.attendances) {
      const student = await this.prisma.student.findUnique({
        where: { id: item.studentId },
        include: { parent: true },
      });

      if (!student) continue;

      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          studentId_groupId: {
            studentId: item.studentId,
            groupId: lesson.groupId,
          },
        },
        include: {
          paymentCycles: {
            orderBy: { cycleNo: 'desc' },
            take: 1,
          },
        },
      });

      if (!enrollment) continue;

      // 1. Davomat yozuvini saqlash yoki yangilash
      const attendance = await this.prisma.attendance.upsert({
        where: {
          lessonId_studentId: {
            lessonId,
            studentId: item.studentId,
          },
        },
        update: {
          status: item.status,
          markedVia,
          markedAt: new Date(),
        },
        create: {
          lessonId,
          studentId: item.studentId,
          enrollmentId: enrollment.id,
          status: item.status,
          markedVia,
          markedAt: new Date(),
        },
      });

      results.push(attendance);

      // 2. Biznes qoidalar bo'yicha hisob-kitob
      let freeLessonsUsed = enrollment.freeLessonsUsed;
      let lessonsDone = enrollment.lessonsDone;
      let consecutiveAbsences = enrollment.consecutiveAbsences;
      let enrollmentStatus = enrollment.status;

      let currentCycle = enrollment.paymentCycles[0];

      if (item.status === AttendanceState.PRESENT) {
        consecutiveAbsences = 0;
        if (freeLessonsUsed < 2) {
          freeLessonsUsed += 1;
        } else {
          lessonsDone += 1;
        }
      } else if (item.status === AttendanceState.ABSENT) {
        consecutiveAbsences += 1;

        // Qoida: Kelsa va kelmasa ham dars bo'ldi deb hisoblanadi!
        if (freeLessonsUsed >= 2) {
          lessonsDone += 1;
        }

        // ZUDLIK BILAN OTA-ONAGA TELEGRAM XABAR
        if (student.parent && student.parent.telegramId) {
          const content =
            `⚠️ <b>Diqqat: Farzandingiz darsga kelmadi!</b>\n\n` +
            `Hurmatli ${student.parent.name},\n` +
            `Farzandingiz <b>${student.name}</b> bugun soat ${lessonTime} dagi "<b>${lesson.group.course.name}</b>" darsiga kelmadi.\n\n` +
            `Iltimos, holat yuzasidan xabardor bo‘ling.`;

          await this.notificationsService.send({
            recipientType: RecipientType.PARENT,
            recipientId: student.parent.id,
            telegramId: student.parent.telegramId,
            type: NotificationType.STUDENT_ABSENT,
            refId: `${lessonId}_${student.id}`,
            content,
          });
        }

        // Ketma-ket 5 marta dars qoldirsa -> SUSPENDED
        if (consecutiveAbsences >= 5) {
          enrollmentStatus = EnrollmentStatus.SUSPENDED;

          const dropContent =
            `🚫 <b>Guruhdan to‘xtatilish to‘g‘risida xabarnoma</b>\n\n` +
            `Hurmatli ${student.name}, siz ketma-ket 5 ta darsda qatnashmaganligingiz sababli "${lesson.group.name}" guruhidagi faoliyatingiz vaqtincha to‘xtatildi.`;

          if (student.telegramId) {
            await this.notificationsService.send({
              recipientType: RecipientType.STUDENT,
              recipientId: student.id,
              telegramId: student.telegramId,
              type: NotificationType.DROPPED_FROM_GROUP,
              content: dropContent,
            });
          }

          if (student.parent && student.parent.telegramId) {
            await this.notificationsService.send({
              recipientType: RecipientType.PARENT,
              recipientId: student.parent.id,
              telegramId: student.parent.telegramId,
              type: NotificationType.DROPPED_FROM_GROUP,
              content: dropContent,
            });
          }
        }
      }

      // Agar bepul darslar tugagan bo'lsa va hali to'lov sikli ochilmagan bo'lsa
      if (freeLessonsUsed >= 2 && !currentCycle) {
        currentCycle = await this.prisma.paymentCycle.create({
          data: {
            enrollmentId: enrollment.id,
            cycleNo: 1,
            lessonsRequired: 12,
            lessonsDone: 0,
            amount: lesson.group.course.price,
            status: PaymentStatus.PENDING,
          },
        });
      }

      // Agar joriy sikl mavjud bo'lsa, uning darslar sonini yangilash
      if (currentCycle && freeLessonsUsed >= 2) {
        const cycleLessonsDone = Math.min(12, currentCycle.lessonsDone + 1);

        await this.prisma.paymentCycle.update({
          where: { id: currentCycle.id },
          data: { lessonsDone: cycleLessonsDone },
        });

        // 10 yoki 11-darsga yetganda keyingi sikl uchun oldindan to'lov eslatmasi
        if (cycleLessonsDone >= 10 && cycleLessonsDone < 12) {
          const nextCycleNo = currentCycle.cycleNo + 1;
          const nextCycleExists = await this.prisma.paymentCycle.findUnique({
            where: {
              enrollmentId_cycleNo: {
                enrollmentId: enrollment.id,
                cycleNo: nextCycleNo,
              },
            },
          });

          if (!nextCycleExists) {
            await this.prisma.paymentCycle.create({
              data: {
                enrollmentId: enrollment.id,
                cycleNo: nextCycleNo,
                lessonsRequired: 12,
                amount: lesson.group.course.price,
                status: PaymentStatus.PENDING,
              },
            });

            // Farzand va Ota-onaga oldindan to'lov eslatmasi
            const studentAlert =
              `💳 <b>Oldindan to‘lov eslatmasi</b>\n\n` +
              `Hurmatli ${student.name}, sizning "${lesson.group.course.name}" kursi bo‘yicha joriy to‘lov siklingiz yakunlanmoqda (${cycleLessonsDone}/12 dars).\n` +
              `Darslar to‘xtab qolmasligi uchun keyingi 12 darslik to‘lovni oldindan amalga oshirishingizni so‘raymiz.\n` +
              `💰 Summa: ${lesson.group.course.price.toLocaleString()} so‘m`;

            if (student.telegramId) {
              await this.notificationsService.send({
                recipientType: RecipientType.STUDENT,
                recipientId: student.id,
                telegramId: student.telegramId,
                type: NotificationType.PAYMENT_DUE,
                refId: `cycle_${nextCycleNo}_${student.id}`,
                content: studentAlert,
              });
            }

            if (student.parent && student.parent.telegramId) {
              const parentAlert =
                `💳 <b>Farzandingiz uchun oldindan to‘lov eslatmasi</b>\n\n` +
                `Hurmatli ${student.parent.name}, farzandingiz ${student.name} ning "${lesson.group.course.name}" kursi bo‘yicha darslar paketi tugamoqda (${cycleLessonsDone}/12 dars).\n` +
                `Keyingi 12 ta dars uchun to‘lovni oldindan amalga oshirishingizni so‘raymiz:\n` +
                `💰 Summa: ${lesson.group.course.price.toLocaleString()} so‘m`;

              await this.notificationsService.send({
                recipientType: RecipientType.PARENT,
                recipientId: student.parent.id,
                telegramId: student.parent.telegramId,
                type: NotificationType.PAYMENT_DUE,
                refId: `cycle_${nextCycleNo}_parent_${student.parent.id}`,
                content: parentAlert,
              });
            }
          }
        }
      }

      // Enrollment yangilash
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          freeLessonsUsed,
          lessonsDone,
          consecutiveAbsences,
          status: enrollmentStatus,
        },
      });
    }

    // Dars holatini DONE qilish
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: LessonStatus.DONE,
        attendanceStatus: AttendanceStatus.DONE,
      },
    });

    await this.auditLogService.log({
      actorId,
      actorRole: actorRole || 'TEACHER',
      action: 'attendance.mark',
      entity: 'Lesson',
      entityId: lessonId,
      after: { lessonId, markedCount: results.length },
    });

    return {
      success: true,
      lessonId,
      markedCount: results.length,
    };
  }

  async getLessonAttendance(lessonId: string, actorId?: string, actorRole?: Role) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        group: {
          include: {
            teacher: true,
            enrollments: {
              where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] } },
              include: {
                student: {
                  include: {
                    parent: { select: { id: true, name: true, phone: true } },
                  },
                },
              },
            },
          },
        },
        attendances: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Dars topilmadi');
    }

    if (actorRole === Role.TEACHER && lesson.group.teacherId !== actorId) {
      throw new ForbiddenException('Bu dars ma‘lumotlarini ko‘rishga ruxsatingiz yo‘q');
    }

    const attendanceMap = new Map<string, AttendanceState>();
    for (const a of lesson.attendances) {
      attendanceMap.set(a.studentId, a.status);
    }

    const students = lesson.group.enrollments.map((e) => ({
      studentId: e.student.id,
      studentName: e.student.name,
      studentPhone: e.student.phone,
      parentName: e.student.parent?.name || null,
      parentPhone: e.student.parent?.phone || null,
      freeLessonsUsed: e.freeLessonsUsed,
      lessonsDone: e.lessonsDone,
      status: attendanceMap.get(e.student.id) || null,
    }));

    return {
      lessonId: lesson.id,
      scheduledAt: lesson.scheduledAt,
      groupName: lesson.group.name,
      room: lesson.group.room,
      students,
    };
  }
}
