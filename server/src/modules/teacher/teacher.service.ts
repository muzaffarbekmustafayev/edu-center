import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EnrollmentStatus, GroupStatus, LessonStatus } from '@prisma/client';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(teacherId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [groupsCount, activeStudentsCount, todayLessonsCount] = await Promise.all([
      this.prisma.group.count({
        where: { teacherId, status: GroupStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.enrollment.count({
        where: {
          group: { teacherId, status: GroupStatus.ACTIVE, deletedAt: null },
          status: EnrollmentStatus.ACTIVE,
        },
      }),
      this.prisma.lesson.count({
        where: {
          group: { teacherId, status: GroupStatus.ACTIVE, deletedAt: null },
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { not: LessonStatus.CANCELLED },
        },
      }),
    ]);

    return {
      groupsCount,
      activeStudentsCount,
      todayLessonsCount,
    };
  }

  async getMyGroups(teacherId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const groups = await this.prisma.group.findMany({
      where: {
        teacherId,
        status: GroupStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        course: { select: { id: true, name: true, price: true } },
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
      room: g.room,
      startDate: g.startDate,
      durationMin: g.durationMin,
      studentCount: g._count.enrollments,
      hasLessonToday: g.lessons.length > 0,
      schedules: g.schedules,
    }));
  }

  async getGroupDetail(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId,
        deletedAt: null,
      },
      include: {
        course: true,
        schedules: true,
        enrollments: {
          where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED] } },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phone: true,
                telegramId: true,
                parentRelation: true,
                parent: {
                  select: { id: true, name: true, phone: true, telegramId: true },
                },
              },
            },
            paymentCycles: {
              orderBy: { cycleNo: 'desc' },
              take: 1,
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Guruh topilmadi yoki bu guruh sizga biriktirilmagan');
    }

    const students = group.enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.student.id,
      studentName: e.student.name,
      studentPhone: e.student.phone,
      isTelegramConnected: !!e.student.telegramId,
      parentName: e.student.parent?.name || null,
      parentPhone: e.student.parent?.phone || null,
      parentRelation: e.student.parentRelation || 'ota-ona',
      freeLessonsUsed: e.freeLessonsUsed,
      lessonsDone: e.lessonsDone,
      status: e.status,
      currentCycle: e.paymentCycles[0]
        ? {
            cycleNo: e.paymentCycles[0].cycleNo,
            status: e.paymentCycles[0].status,
            lessonsDone: e.paymentCycles[0].lessonsDone,
            lessonsRequired: e.paymentCycles[0].lessonsRequired,
            amount: e.paymentCycles[0].amount,
          }
        : null,
    }));

    return {
      group: {
        id: group.id,
        name: group.name,
        courseName: group.course.name,
        coursePrice: group.course.price,
        room: group.room,
        durationMin: group.durationMin,
        startDate: group.startDate,
        schedules: group.schedules,
      },
      students,
    };
  }

  async getStudentAttendanceHistory(
    teacherId: string,
    groupId: string,
    studentId: string,
  ) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, teacherId, deletedAt: null },
      include: { course: true },
    });

    if (!group) {
      throw new ForbiddenException('Bu guruhga kirish huquqingiz yo‘q');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_groupId: { studentId, groupId },
      },
      include: {
        student: {
          include: {
            parent: { select: { id: true, name: true, phone: true } },
          },
        },
        paymentCycles: {
          orderBy: { cycleNo: 'desc' },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('O‘quvchi ushbu guruhda topilmadi');
    }

    // Guruhning barcha darslari va ushbu o'quvchining davomati
    const lessons = await this.prisma.lesson.findMany({
      where: { groupId },
      include: {
        attendances: {
          where: { studentId },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    const attendanceHistory = lessons.map((l) => ({
      lessonId: l.id,
      scheduledAt: l.scheduledAt,
      lessonStatus: l.status,
      cancelReason: l.cancelReason,
      attendanceStatus: l.attendances[0]?.status || 'NOT_MARKED',
      markedVia: l.attendances[0]?.markedVia || null,
      markedAt: l.attendances[0]?.markedAt || null,
    }));

    return {
      student: {
        id: enrollment.student.id,
        name: enrollment.student.name,
        phone: enrollment.student.phone,
        status: enrollment.status,
        freeLessonsUsed: enrollment.freeLessonsUsed,
        lessonsDone: enrollment.lessonsDone,
        consecutiveAbsences: enrollment.consecutiveAbsences,
        parent: enrollment.student.parent,
        parentRelation: enrollment.student.parentRelation,
      },
      group: {
        id: group.id,
        name: group.name,
        courseName: group.course.name,
      },
      paymentCycles: enrollment.paymentCycles,
      attendanceHistory,
    };
  }
}
