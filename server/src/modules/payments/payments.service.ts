import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import {
  PaymentStatus,
  TxType,
  NotificationType,
  RecipientType,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreatePaymentDto, actorId: string) {
    const cycle = await this.prisma.paymentCycle.findUnique({
      where: { id: dto.cycleId },
      include: {
        enrollment: {
          include: {
            student: { include: { parent: true } },
            group: { include: { course: true } },
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('To‘lov sikli topilmadi');
    }

    if (cycle.status === PaymentStatus.PAID) {
      throw new BadRequestException('Ushbu sikl uchun to‘lov allaqachon qabul qilingan (PAID)');
    }

    // 1. Tranzaksiya bilan Payment va Cycle yangilanishi
    const [payment, updatedCycle] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          cycleId: dto.cycleId,
          amount: dto.amount,
          method: dto.method,
          paidAt: new Date(),
          recordedBy: actorId,
          note: dto.note || null,
        },
      }),
      this.prisma.paymentCycle.update({
        where: { id: dto.cycleId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      }),
      this.prisma.transaction.create({
        data: {
          type: TxType.INCOME,
          category: 'tuition',
          amount: dto.amount,
          note: `To‘lov: ${cycle.enrollment.student.name} (${cycle.enrollment.group.course.name}, sikl #${cycle.cycleNo}). ${dto.note || ''}`.trim(),
          date: new Date(),
          createdBy: actorId,
        },
      }),
    ]);

    const student = cycle.enrollment.student;
    const courseName = cycle.enrollment.group.course.name;
    const paidDate = new Date().toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    // 2. Farzand va Ota-onaga kvitansiya jo'natish
    const receiptContent =
      `✅ <b>To‘lov qabul qilindi!</b>\n\n` +
      `Hurmatli ${student.name},\n` +
      `Sizning "<b>${courseName}</b>" kursi (sikl #${cycle.cycleNo}) uchun to‘lovingiz muvaffaqiyatli tizimga kiritildi.\n\n` +
      `📄 Kvitansiya №: <code>${payment.id.slice(-8).toUpperCase()}</code>\n` +
      `💰 Summa: <b>${dto.amount.toLocaleString()} so‘m</b>\n` +
      `💳 To‘lov usuli: ${dto.method}\n` +
      `📅 Sana: ${paidDate}\n\n` +
      `Edu Center ni tanlaganingiz uchun tashakkur!`;

    if (student.telegramId) {
      await this.notificationsService.send({
        recipientType: RecipientType.STUDENT,
        recipientId: student.id,
        telegramId: student.telegramId,
        type: NotificationType.PAYMENT_RECEIVED,
        refId: payment.id,
        content: receiptContent,
      });
    }

    if (student.parent && student.parent.telegramId) {
      const parentReceiptContent =
        `✅ <b>Farzandingiz to‘lovi qabul qilindi!</b>\n\n` +
        `Hurmatli ${student.parent.name},\n` +
        `Farzandingiz <b>${student.name}</b> ning "<b>${courseName}</b>" kursi uchun to‘lovi qabul qilindi.\n\n` +
        `📄 Kvitansiya №: <code>${payment.id.slice(-8).toUpperCase()}</code>\n` +
        `💰 Summa: <b>${dto.amount.toLocaleString()} so‘m</b>\n` +
        `💳 To‘lov usuli: ${dto.method}\n` +
        `📅 Sana: ${paidDate}\n\n` +
        `Edu Center ni tanlaganingiz uchun tashakkur!`;

      await this.notificationsService.send({
        recipientType: RecipientType.PARENT,
        recipientId: student.parent.id,
        telegramId: student.parent.telegramId,
        type: NotificationType.PAYMENT_RECEIVED,
        refId: `${payment.id}_parent`,
        content: parentReceiptContent,
      });
    }

    await this.auditLogService.log({
      actorId,
      actorRole: 'ADMIN',
      action: 'payment.create',
      entity: 'Payment',
      entityId: payment.id,
      after: { payment, cycleId: cycle.id },
    });

    return {
      payment,
      cycle: updatedCycle,
    };
  }

  async getDebtors() {
    const cycles = await this.prisma.paymentCycle.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                telegramId: true,
                parent: { select: { id: true, name: true, phone: true } },
              },
            },
            group: {
              include: {
                course: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return cycles.map((c) => {
      let daysOverdue = 0;
      if (c.dueAt && c.dueAt < now) {
        const diffMs = now.getTime() - c.dueAt.getTime();
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        cycleId: c.id,
        cycleNo: c.cycleNo,
        amount: c.amount,
        status: c.status,
        dueAt: c.dueAt,
        daysOverdue,
        lessonsDone: c.lessonsDone,
        lessonsRequired: c.lessonsRequired,
        studentId: c.enrollment.student.id,
        studentName: c.enrollment.student.name,
        studentPhone: c.enrollment.student.phone,
        parentName: c.enrollment.student.parent?.name || null,
        parentPhone: c.enrollment.student.parent?.phone || null,
        groupName: c.enrollment.group.name,
        courseName: c.enrollment.group.course.name,
      };
    });
  }

  async findAll(query: { take?: number; skip?: number }) {
    const { take = 50, skip = 0 } = query;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        include: {
          cycle: {
            include: {
              enrollment: {
                include: {
                  student: { select: { id: true, name: true, phone: true } },
                  group: { include: { course: true } },
                },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.payment.count(),
    ]);

    return { items, total };
  }
}
