import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import {
  LinkTelegramDto,
  RegisterStudentWithParentDto,
} from './dto/internal-auth.dto.js';
import { normalizePhone } from '../../common/utils/phone.util.js';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const phone = normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto‘g‘ri');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Telefon raqam yoki parol noto‘g‘ri');
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        language: user.language,
        telegramId: user.telegramId,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        process.env.JWT_REFRESH_SECRET ||
        'edu_center_super_secret_jwt_refresh_key_min_32_characters_long';

      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi');
      }

      const tokens = await this.generateTokens(user.id, user.phone, user.role);
      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token yaroqsiz yoki muddati o‘tgan');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        telegramId: true,
        language: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return user;
  }

  // --- BOT INTERNAL AUTH METODLARI ---

  async checkUserByTelegramId(telegramId: string) {
    // 1. O'qituvchi yoki Admin (Admin paneldan telegramId kiritilgan)
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, name: true, role: true, phone: true },
    });
    if (user) {
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
      };
    }

    // 2. O'quvchi
    const student = await this.prisma.student.findUnique({
      where: { telegramId },
      select: { id: true, name: true, phone: true, status: true },
    });
    if (student) {
      return {
        id: student.id,
        name: student.name,
        role: 'STUDENT',
        phone: student.phone,
      };
    }

    // 3. Ota-ona
    const parent = await this.prisma.parent.findUnique({
      where: { telegramId },
      select: { id: true, name: true, phone: true },
    });
    if (parent) {
      return {
        id: parent.id,
        name: parent.name,
        role: 'PARENT',
        phone: parent.phone,
      };
    }

    return null;
  }

  async linkTelegram(dto: LinkTelegramDto) {
    const phone = normalizePhone(dto.phone);

    // 1. Xodim (Teacher/Admin)
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      if (user.telegramId && user.telegramId !== dto.telegramId) {
        throw new ConflictException('Bu telefon raqam boshqa Telegram akkauntiga bog‘langan');
      }
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramId: dto.telegramId },
        select: { id: true, name: true, role: true },
      });
      return updated;
    }

    // 2. O'quvchi
    const student = await this.prisma.student.findUnique({ where: { phone } });
    if (student) {
      if (student.telegramId && student.telegramId !== dto.telegramId) {
        throw new ConflictException('Bu telefon raqam boshqa Telegram akkauntiga bog‘langan');
      }
      const updated = await this.prisma.student.update({
        where: { id: student.id },
        data: { telegramId: dto.telegramId },
        select: { id: true, name: true },
      });
      return { ...updated, role: 'STUDENT' };
    }

    // 3. Ota-ona
    const parent = await this.prisma.parent.findUnique({ where: { phone } });
    if (parent) {
      if (parent.telegramId && parent.telegramId !== dto.telegramId) {
        throw new ConflictException('Bu telefon raqam boshqa Telegram akkauntiga bog‘langan');
      }
      const updated = await this.prisma.parent.update({
        where: { id: parent.id },
        data: { telegramId: dto.telegramId },
        select: { id: true, name: true },
      });
      return { ...updated, role: 'PARENT' };
    }

    throw new NotFoundException('Telefon raqam tizimda topilmadi');
  }

  async registerStudentWithParent(dto: RegisterStudentWithParentDto) {
    const studentPhone = normalizePhone(dto.studentPhone);
    const parentPhone = normalizePhone(dto.parentPhone);

    // 1. Ota-onani topish yoki yangi yaratish
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

    // 2. O'quvchini yaratish yoki yangilash
    const student = await this.prisma.student.upsert({
      where: { phone: studentPhone },
      update: {
        telegramId: dto.studentTelegramId,
        name: dto.studentName,
        parentId: parent.id,
        status: StudentStatus.ACTIVE,
      },
      create: {
        telegramId: dto.studentTelegramId,
        phone: studentPhone,
        name: dto.studentName,
        parentId: parent.id,
        status: StudentStatus.ACTIVE,
      },
    });

    return {
      studentId: student.id,
      studentName: student.name,
      parentPhone: parent.phone,
    };
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'edu_center_super_secret_jwt_access_key_min_32_characters_long';

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      'edu_center_super_secret_jwt_refresh_key_min_32_characters_long';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
