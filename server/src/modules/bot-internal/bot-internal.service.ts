import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AttendanceService } from '../attendance/attendance.service.js';
import { MarkAttendanceDto } from '../attendance/dto/mark-attendance.dto.js';
import {
  Role,
  PaymentStatus,
  EnrollmentStatus,
  LessonStatus,
  MarkedVia,
} from '@prisma/client';

@Injectable()
export class BotInternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async getBalance(telegramId: string) {
    // 1. O'quvchi tekshirish
    const student = await this.prisma.student.findUnique({
      where: { telegramId },
      include: {
        enrollments: {
          where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] } },
          include: {
            group: { include: { course: true } },
            paymentCycles: {
              orderBy: { cycleNo: 'desc' },
              take: 3,
            },
          },
        },
      },
    });

    if (student) {
      return this.formatStudentBalance(student);
    }

    // 2. Ota-ona tekshirish
    const parent = await this.prisma.parent.findUnique({
      where: { telegramId },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            enrollments: {
              where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] } },
              include: {
                group: { include: { course: true } },
                paymentCycles: {
                  orderBy: { cycleNo: 'desc' },
                  take: 3,
                },
              },
            },
          },
        },
      },
    });

    if (parent) {
      return this.formatParentBalance(parent);
    }

    throw new NotFoundException('Foydalanuvchi tizimda topilmadi');
  }

  private async formatStudentBalance(student: any) {
    const cycles: any[] = [];
    let totalDebt = 0;

    for (const e of student.enrollments) {
      for (const c of e.paymentCycles) {
        cycles.push({
          courseName: e.group.course.name,
          groupName: e.group.name,
          cycleNo: c.cycleNo,
          amount: c.amount,
          lessonsDone: c.lessonsDone,
          lessonsRequired: c.lessonsRequired,
          status: c.status,
          dueAt: c.dueAt,
        });

        if (c.status === PaymentStatus.PENDING || c.status === PaymentStatus.OVERDUE) {
          totalDebt += c.amount;
        }
      }
    }

    // Oxirgi 3 oyda to'langan to'lovlar
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentPayments = await this.prisma.payment.findMany({
      where: {
        cycle: {
          enrollment: { studentId: student.id },
        },
        paidAt: { gte: threeMonthsAgo },
      },
      include: {
        cycle: {
          include: {
            enrollment: {
              include: { group: { include: { course: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: 3,
    });

    const totalPaid = recentPayments.reduce((acc, p) => acc + p.amount, 0);

    return {
      role: 'STUDENT',
      studentName: student.name,
      cycles,
      totalDebt,
      totalPaid,
      recentPayments: recentPayments.map((p) => ({
        amount: p.amount,
        paidAt: p.paidAt,
        courseName: p.cycle.enrollment.group.course.name,
      })),
    };
  }

  private async formatParentBalance(parent: any) {
    let totalDebt = 0;
    const children: any[] = [];

    for (const child of parent.children) {
      const childCycles: any[] = [];

      for (const e of child.enrollments) {
        for (const c of e.paymentCycles) {
          childCycles.push({
            courseName: e.group.course.name,
            groupName: e.group.name,
            cycleNo: c.cycleNo,
            amount: c.amount,
            lessonsDone: c.lessonsDone,
            lessonsRequired: c.lessonsRequired,
            status: c.status,
            dueAt: c.dueAt,
          });

          if (c.status === PaymentStatus.PENDING || c.status === PaymentStatus.OVERDUE) {
            totalDebt += c.amount;
          }
        }
      }

      children.push({
        studentId: child.id,
        studentName: child.name,
        cycles: childCycles,
      });
    }

    return {
      role: 'PARENT',
      parentName: parent.name,
      totalDebt,
      children,
    };
  }

  async getUpcomingLessons(telegramId: string) {
    let studentIds: string[] = [];

    // O'quvchi yoki Ota-onani aniqlash
    const student = await this.prisma.student.findUnique({ where: { telegramId } });
    if (student) {
      studentIds = [student.id];
    } else {
      const parent = await this.prisma.parent.findUnique({
        where: { telegramId },
        include: { children: { select: { id: true } } },
      });
      if (parent) {
        studentIds = parent.children.map((c) => c.id);
      }
    }

    if (studentIds.length === 0) {
      throw new NotFoundException('Foydalanuvchi yoki biriktirilgan farzandlar topilmadi');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: { in: studentIds },
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] },
      },
      select: { groupId: true },
    });

    const groupIds = [...new Set(enrollments.map((e) => e.groupId))];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(todayEnd);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // 1. Bugungi darslar
    const todayLessons = await this.prisma.lesson.findMany({
      where: {
        groupId: { in: groupIds },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        group: { include: { course: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // 2. Keyingi 7 kun darslari
    const upcomingLessons = await this.prisma.lesson.findMany({
      where: {
        groupId: { in: groupIds },
        scheduledAt: { gt: todayEnd, lte: weekEnd },
        status: { not: LessonStatus.CANCELLED },
      },
      include: {
        group: { include: { course: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    // 3. Oxirgi 3 ta o'tgan dars davomat bilan
    const pastLessons = await this.prisma.lesson.findMany({
      where: {
        groupId: { in: groupIds },
        scheduledAt: { lt: todayStart },
        status: LessonStatus.DONE,
      },
      include: {
        group: { include: { course: true } },
        attendances: {
          where: { studentId: { in: studentIds } },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 3,
    });

    return {
      today: todayLessons.map((l) => ({
        lessonId: l.id,
        time: new Date(l.scheduledAt).toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tashkent',
        }),
        courseName: l.group.course.name,
        groupName: l.group.name,
        room: l.group.room,
        status: l.status,
        cancelReason: l.cancelReason,
      })),
      upcoming: upcomingLessons.map((l) => ({
        lessonId: l.id,
        date: l.scheduledAt,
        time: new Date(l.scheduledAt).toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tashkent',
        }),
        courseName: l.group.course.name,
        groupName: l.group.name,
      })),
      past: pastLessons.map((l) => ({
        lessonId: l.id,
        date: l.scheduledAt,
        courseName: l.group.course.name,
        attendance: l.attendances[0]?.status || 'NOT_MARKED',
      })),
    };
  }

  async getTeacherGroups(telegramId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { telegramId, role: Role.TEACHER },
    });
    if (!teacher) {
      throw new ForbiddenException('O‘qituvchi topilmadi');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const groups = await this.prisma.group.findMany({
      where: {
        teacherId: teacher.id,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        course: true,
        schedules: true,
        _count: {
          select: { enrollments: { where: { status: EnrollmentStatus.ACTIVE } } },
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

    return groups.map((g) => {
      const scheduleStr = g.schedules
        .map((s) => {
          const days = ['', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
          return `${days[s.dayOfWeek]} ${s.startTime}`;
        })
        .join(', ');

      return {
        id: g.id,
        name: g.name,
        courseName: g.course.name,
        studentCount: g._count.enrollments,
        schedule: scheduleStr || 'Jadval belgilanmagan',
        hasLessonToday: g.lessons.length > 0,
      };
    });
  }

  async getTeacherGroupDetail(telegramId: string, groupId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { telegramId, role: Role.TEACHER },
    });
    if (!teacher) throw new ForbiddenException('O‘qituvchi topilmadi');

    const group = await this.prisma.group.findFirst({
      where: { id: groupId, teacherId: teacher.id, deletedAt: null },
      include: {
        course: true,
        schedules: true,
        enrollments: {
          include: {
            paymentCycles: {
              where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] } },
            },
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Guruh topilmadi');

    const activeCount = group.enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length;
    const suspendedCount = group.enrollments.filter((e) => e.status === EnrollmentStatus.SUSPENDED).length;
    const debtorCount = group.enrollments.filter((e) => e.paymentCycles.length > 0).length;

    const scheduleStr = group.schedules
      .map((s) => {
        const days = ['', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
        return `${days[s.dayOfWeek]} ${s.startTime}`;
      })
      .join(', ');

    return {
      id: group.id,
      name: group.name,
      courseName: group.course.name,
      coursePrice: group.course.price,
      studentCount: group.enrollments.length,
      schedule: scheduleStr,
      activeCount,
      suspendedCount,
      debtorCount,
    };
  }

  async getGroupStudentsForAttendance(telegramId: string, groupId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { telegramId, role: Role.TEACHER },
    });
    if (!teacher) throw new ForbiddenException('O‘qituvchi topilmadi');

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        groupId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] },
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    return enrollments.map((e) => ({
      studentId: e.student.id,
      studentName: e.student.name,
    }));
  }

  async finalizeAttendanceFromBot(
    telegramId: string,
    lessonId: string,
    dto: MarkAttendanceDto,
  ) {
    const teacher = await this.prisma.user.findUnique({
      where: { telegramId, role: Role.TEACHER },
    });
    if (!teacher) throw new ForbiddenException('O‘qituvchi topilmadi');

    return this.attendanceService.markAttendance(
      lessonId,
      dto,
      teacher.id,
      Role.TEACHER,
      MarkedVia.BOT,
    );
  }
}
