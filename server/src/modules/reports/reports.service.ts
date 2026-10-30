import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  GroupStatus,
  LessonStatus,
  PaymentStatus,
  StudentStatus,
  TxType,
} from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalStudents,
      activeGroups,
      monthlyIncomeTx,
      monthlyExpenseTx,
      debtorsCount,
      todayLessons,
    ] = await Promise.all([
      this.prisma.student.count({
        where: { status: StudentStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.group.count({
        where: { status: GroupStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: TxType.INCOME,
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: TxType.EXPENSE,
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.paymentCycle.count({
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        },
      }),
      this.prisma.lesson.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { not: LessonStatus.CANCELLED },
        },
        include: {
          group: {
            include: {
              course: { select: { id: true, name: true } },
              teacher: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);

    const monthlyIncome = monthlyIncomeTx._sum.amount || 0;
    const monthlyExpense = monthlyExpenseTx._sum.amount || 0;
    const netProfit = monthlyIncome - monthlyExpense;

    return {
      totalStudents,
      activeGroups,
      monthlyIncome,
      monthlyExpense,
      netProfit,
      debtorsCount,
      todayLessons: todayLessons.map((l) => ({
        id: l.id,
        scheduledAt: l.scheduledAt,
        groupName: l.group.name,
        courseName: l.group.course.name,
        teacherName: l.group.teacher.name,
        room: l.group.room,
        attendanceStatus: l.attendanceStatus,
      })),
    };
  }

  async getFinancial(query: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = query;
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const categoryBreakdown: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === TxType.INCOME) {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }

      categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
    }

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      categoryBreakdown,
      transactionCount: transactions.length,
    };
  }

  async getTeacherRevenue(teacherId: string) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        paidAt: { gte: currentMonthStart, lte: currentMonthEnd },
        cycle: {
          enrollment: {
            group: { teacherId },
          },
        },
      },
      include: {
        cycle: {
          include: {
            enrollment: {
              include: {
                student: { select: { id: true, name: true } },
                group: { include: { course: true } },
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    return {
      totalRevenue,
      paymentCount: payments.length,
      payments: payments.map((p) => ({
        paymentId: p.id,
        amount: p.amount,
        paidAt: p.paidAt,
        studentName: p.cycle.enrollment.student.name,
        groupName: p.cycle.enrollment.group.name,
        courseName: p.cycle.enrollment.group.course.name,
      })),
    };
  }
}
