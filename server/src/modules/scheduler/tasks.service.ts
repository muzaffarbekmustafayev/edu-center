import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { GroupsService } from '../groups/groups.service.js';
import {
  GroupStatus,
  LessonStatus,
  AttendanceStatus,
  PaymentStatus,
  NotificationType,
  RecipientType,
  EnrollmentStatus,
} from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly groupsService: GroupsService,
  ) {}

  /**
   * 1. Har kuni soat 03:00 da: 90 kunlik darslarni oldindan generatsiya qilish
   */
  @Cron('0 3 * * *', { timeZone: 'Asia/Tashkent' })
  async handleGenerateLessons() {
    this.logger.log('Darslar generatsiyasi croni ishga tushdi (03:00)...');

    const groups = await this.prisma.group.findMany({
      where: { status: GroupStatus.ACTIVE, deletedAt: null },
      include: {
        lessons: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + 90);

    for (const group of groups) {
      const lastLesson = group.lessons[0];
      const lastDate = lastLesson ? new Date(lastLesson.scheduledAt) : now;

      if (lastDate < thresholdDate) {
        await this.groupsService.generateLessonsForGroup(group.id, lastDate, 90);
      }
    }
  }

  /**
   * 2. Har daqiqada: Dars boshlanish vaqti kelganda O‘qituvchiga "Yo‘qlamani boshlash" so‘rovi
   */
  @Cron('* * * * *', { timeZone: 'Asia/Tashkent' })
  async handleLessonAttendanceRequest() {
    const now = new Date();
    const fiveMinutesAhead = new Date(now.getTime() + 5 * 60 * 1000);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        status: LessonStatus.SCHEDULED,
        attendanceStatus: AttendanceStatus.NOT_SENT,
        scheduledAt: { lte: fiveMinutesAhead, gte: new Date(now.getTime() - 60 * 60 * 1000) },
      },
      include: {
        group: {
          include: {
            teacher: true,
            course: true,
          },
        },
      },
    });

    for (const lesson of lessons) {
      const teacher = lesson.group.teacher;
      if (!teacher || !teacher.telegramId) continue;

      const timeStr = new Date(lesson.scheduledAt).toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tashkent',
      });

      const content =
        `🔔 <b>Dars vaqti bo‘ldi!</b>\n\n` +
        `📚 Guruh: <b>${lesson.group.name}</b>\n` +
        `📖 Kurs: <b>${lesson.group.course.name}</b>\n` +
        `📍 Xona: ${lesson.group.room || 'Belgilanmagan'} (${lesson.group.durationMin} daqiqa)\n` +
        `⏰ Boshlanish vaqti: ${timeStr}\n\n` +
        `Iltimos, guruh o‘quvchilari yo‘qlamasini o‘tkazing:`;

      await this.notificationsService.send({
        recipientType: RecipientType.TEACHER,
        recipientId: teacher.id,
        telegramId: teacher.telegramId,
        type: NotificationType.ATTENDANCE_REQUEST,
        refId: lesson.id,
        content,
      });

      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          attendanceStatus: AttendanceStatus.SENT,
          attendanceSentAt: new Date(),
        },
      });
    }
  }

  /**
   * 3. Har daqiqada: Darsdan 15 daqiqa oldin o‘quvchi va ota-onaga eslatma
   */
  @Cron('* * * * *', { timeZone: 'Asia/Tashkent' })
  async handleLessonStudentReminder() {
    const now = new Date();
    const fifteenMinAheadStart = new Date(now.getTime() + 14 * 60 * 1000);
    const fifteenMinAheadEnd = new Date(now.getTime() + 16 * 60 * 1000);

    const lessons = await this.prisma.lesson.findMany({
      where: {
        status: LessonStatus.SCHEDULED,
        scheduledAt: { gte: fifteenMinAheadStart, lte: fifteenMinAheadEnd },
      },
      include: {
        group: {
          include: {
            course: true,
            teacher: true,
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

    for (const lesson of lessons) {
      const timeStr = new Date(lesson.scheduledAt).toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tashkent',
      });

      for (const enrollment of lesson.group.enrollments) {
        const student = enrollment.student;

        const message =
          `🔔 <b>Dars eslatmasi!</b>\n\n` +
          `Hurmatli ${student.name}, bugun soat <b>${timeStr}</b> da "<b>${lesson.group.course.name}</b>" darsingiz boshlanadi.\n` +
          `📍 Xona: ${lesson.group.room || 'Belgilanmagan'}\n` +
          `👨‍🏫 O‘qituvchi: ${lesson.group.teacher.name}\n\n` +
          `Kechikmasdan kelishingizni so‘raymiz!`;

        if (student.telegramId) {
          await this.notificationsService.send({
            recipientType: RecipientType.STUDENT,
            recipientId: student.id,
            telegramId: student.telegramId,
            type: NotificationType.LESSON_REMINDER,
            refId: `remind_${lesson.id}_${student.id}`,
            content: message,
          });
        }

        if (student.parent && student.parent.telegramId) {
          await this.notificationsService.send({
            recipientType: RecipientType.PARENT,
            recipientId: student.parent.id,
            telegramId: student.parent.telegramId,
            type: NotificationType.LESSON_REMINDER,
            refId: `remind_${lesson.id}_parent_${student.parent.id}`,
            content: message,
          });
        }
      }
    }
  }

  /**
   * 4. Har kuni soat 00:05 da: dueAt muddati o'tgan sikllarni OVERDUE deb belgilash
   */
  @Cron('5 0 * * *', { timeZone: 'Asia/Tashkent' })
  async handlePaymentOverdueMark() {
    this.logger.log('To‘lov muddati o‘tganlarni OVERDUE qilish (00:05)...');

    const result = await this.prisma.paymentCycle.updateMany({
      where: {
        status: PaymentStatus.PENDING,
        dueAt: { lt: new Date() },
      },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });

    this.logger.log(`${result.count} ta sikl OVERDUE holatiga o‘tkazildi`);
  }

  /**
   * 5. Har kuni soat 09:00 da: To‘lov eslatmasi (Multi-child jamlangan holda)
   */
  @Cron('0 9 * * *', { timeZone: 'Asia/Tashkent' })
  async handlePaymentDueCheck() {
    this.logger.log('Kunlik to‘lov eslatmalari (09:00)...');

    const cycles = await this.prisma.paymentCycle.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      },
      include: {
        enrollment: {
          include: {
            student: { include: { parent: true } },
            group: { include: { course: true } },
          },
        },
      },
    });

    const now = new Date();

    // 1. O'quvchilarga alohida eslatma
    for (const c of cycles) {
      const student = c.enrollment.student;
      if (!student.telegramId) continue;

      const courseName = c.enrollment.group.course.name;
      let text = '';

      if (c.status === PaymentStatus.OVERDUE) {
        text =
          `⚠️ <b>To‘lov eslatmasi (Kechikmoqda)</b>\n\n` +
          `Hurmatli ${student.name}, sizning "<b>${courseName}</b>" kursi bo‘yicha <b>${c.amount.toLocaleString()} so‘m</b> to‘lovingiz muddati kechikmoqda.\n` +
          `Iltimos, darslar to‘xtab qolmasligi uchun to‘lovni bugun amalga oshiring.`;
      } else {
        text =
          `💳 <b>Oldindan to‘lov eslatmasi</b>\n\n` +
          `Hurmatli ${student.name}, sizning "<b>${courseName}</b>" kursi bo‘yicha to‘lov muddati yaqinlashmoqda.\n` +
          `💰 Summa: <b>${c.amount.toLocaleString()} so‘m</b>\n` +
          `Iltimos, to‘lovni o‘z vaqtida amalga oshiring.`;
      }

      await this.notificationsService.send({
        recipientType: RecipientType.STUDENT,
        recipientId: student.id,
        telegramId: student.telegramId,
        type: c.status === PaymentStatus.OVERDUE ? NotificationType.PAYMENT_OVERDUE : NotificationType.PAYMENT_DUE,
        refId: `daily_${c.id}_${now.toISOString().slice(0, 10)}`,
        content: text,
      });
    }

    // 2. Ota-onalar bo'yicha guruhlash (Multi-child)
    const parentMap = new Map<string, { parent: any; items: any[]; totalAmount: number }>();

    for (const c of cycles) {
      const parent = c.enrollment.student.parent;
      if (!parent || !parent.telegramId) continue;

      const groupData = parentMap.get(parent.id) || {
        parent,
        items: [],
        totalAmount: 0,
      };

      groupData.items.push({
        studentName: c.enrollment.student.name,
        courseName: c.enrollment.group.course.name,
        amount: c.amount,
        status: c.status,
      });
      groupData.totalAmount += c.amount;

      parentMap.set(parent.id, groupData);
    }

    for (const [, data] of parentMap) {
      let content =
        `💳 <b>Farzandlaringiz bo‘yicha to‘lov eslatmasi</b>\n\n` +
        `Hurmatli ${data.parent.name},\n\n`;

      data.items.forEach((item, index) => {
        content += `${index + 1}. <b>${item.studentName}</b> — ${item.courseName} (${item.amount.toLocaleString()} so‘m)\n`;
      });

      content +=
        `\n💰 <b>Jami to‘lov: ${data.totalAmount.toLocaleString()} so‘m</b>\n\n` +
        `Iltimos, darslar to‘xtab qolmasligi uchun to‘lovni o‘z vaqtida amalga oshirishingizni so‘raymiz.`;

      await this.notificationsService.send({
        recipientType: RecipientType.PARENT,
        recipientId: data.parent.id,
        telegramId: data.parent.telegramId,
        type: NotificationType.PAYMENT_DUE,
        refId: `daily_parent_${data.parent.id}_${now.toISOString().slice(0, 10)}`,
        content,
      });
    }
  }
}
