import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  NotificationType,
  RecipientType,
  Language,
  NotifStatus,
} from '@prisma/client';

export interface SendNotificationOptions {
  recipientType: RecipientType;
  recipientId: string;
  telegramId: string;
  type: NotificationType;
  refId?: string;
  language?: Language;
  content: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly botToken: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.botToken =
      this.configService.get<string>('TELEGRAM_BOT_TOKEN') ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';
  }

  async send(options: SendNotificationOptions) {
    const {
      recipientType,
      recipientId,
      telegramId,
      type,
      refId,
      language = Language.UZ,
      content,
    } = options;

    if (!telegramId) {
      this.logger.warn(`Telegram ID yo'q, xabar yuborilmadi: recipientId=${recipientId}`);
      return null;
    }

    // 1. Idempotentlik tekshiruvi: Agar refId bo'lsa, avval yuborilganmi?
    if (refId) {
      const existing = await this.prisma.notification.findUnique({
        where: {
          recipientType_recipientId_type_refId: {
            recipientType,
            recipientId,
            type,
            refId,
          },
        },
      });

      if (existing && existing.status === NotifStatus.SENT) {
        this.logger.log(`Xabar allaqachon yuborilgan (idempotent): type=${type}, refId=${refId}`);
        return existing;
      }
    }

    // 2. Bazada PENDING yozuv yaratish yoki yangilash
    let notification;
    if (refId) {
      notification = await this.prisma.notification.upsert({
        where: {
          recipientType_recipientId_type_refId: {
            recipientType,
            recipientId,
            type,
            refId,
          },
        },
        update: {
          content,
          language,
          status: NotifStatus.PENDING,
        },
        create: {
          recipientType,
          recipientId,
          telegramId,
          type,
          refId,
          language,
          content,
          status: NotifStatus.PENDING,
        },
      });
    } else {
      notification = await this.prisma.notification.create({
        data: {
          recipientType,
          recipientId,
          telegramId,
          type,
          language,
          content,
          status: NotifStatus.PENDING,
        },
      });
    }

    // 3. Telegram API ga jo'natish
    if (!this.botToken || this.botToken === 'your_bot_token_here' || this.botToken.startsWith('1234567890')) {
      this.logger.warn(`Haqiqiy TELEGRAM_BOT_TOKEN ko'rsatilmagan. Simulyatsiya qilindi.`);
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotifStatus.SENT, sentAt: new Date() },
      });
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      await firstValueFrom(
        this.httpService.post(url, {
          chat_id: telegramId,
          text: content,
          parse_mode: 'HTML',
        }),
      );

      return await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotifStatus.SENT, sentAt: new Date() },
      });
    } catch (error: any) {
      let errorReason = error?.message || 'Noma\'lum xatolik';

      if (error?.response?.status === 403) {
        errorReason = 'bot_blocked';
        this.logger.warn(`Foydalanuvchi botni bloklagan: telegramId=${telegramId}`);
      } else {
        this.logger.error(`Telegram xabar yuborishda xatolik: ${errorReason}`);
      }

      return await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotifStatus.FAILED, errorReason },
      });
    }
  }

  async findAll(query: { status?: NotifStatus; type?: NotificationType; take?: number; skip?: number }) {
    const { status, type, take = 50, skip = 0 } = query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total };
  }
}
