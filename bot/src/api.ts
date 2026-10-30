import axios, { AxiosInstance } from 'axios';
import { config } from './config.js';
import { InternalUser } from './types.js';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${config.serverApiUrl}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': config.internalApiKey,
      },
      timeout: 10000,
    });
  }

  // 1. Foydalanuvchini Telegram ID bo'yicha tekshirish
  async checkUserByTelegramId(telegramId: string): Promise<InternalUser | null> {
    try {
      const res = await this.client.get(`/internal/auth/check-user/${telegramId}`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  // 2. Yangi o'quvchini bitta mas'ul ota-ona bilan birga ro'yxatdan o'tkazish
  async registerStudentWithParent(data: {
    studentTelegramId: string;
    studentPhone: string;
    studentName: string;
    parentPhone: string;
    parentName?: string;
  }) {
    const res = await this.client.post('/internal/auth/register-student-with-parent', data);
    return res.data;
  }

  // 3. Telefon raqam orqali telegram ID ni bog'lash
  async linkTelegram(telegramId: string, phone: string) {
    const res = await this.client.post('/internal/auth/link-telegram', {
      telegramId,
      phone,
    });
    return res.data;
  }

  // 4. Balans ma'lumotlari (/balans)
  async getBalance(telegramId: string) {
    const res = await this.client.get(`/internal/bot/students/balance/${telegramId}`);
    return res.data;
  }

  // 5. Darslar jadvali (/darslar)
  async getUpcomingLessons(telegramId: string) {
    const res = await this.client.get(`/internal/bot/students/lessons/${telegramId}`);
    return res.data;
  }

  // 6. O'qituvchining guruhlari (/guruhlarim)
  async getTeacherGroups(telegramId: string) {
    const res = await this.client.get(`/internal/bot/teachers/groups/${telegramId}`);
    return res.data;
  }

  // 7. O'qituvchi guruhi tafsilotlari
  async getTeacherGroupDetail(telegramId: string, groupId: string) {
    const res = await this.client.get(`/internal/bot/teachers/groups/${telegramId}/${groupId}`);
    return res.data;
  }

  // 8. Guruh o'quvchilari ro'yxati (davomat uchun)
  async getGroupStudents(telegramId: string, groupId: string) {
    const res = await this.client.get(
      `/internal/bot/teachers/groups/${telegramId}/${groupId}/students`,
    );
    return res.data;
  }

  // 9. Davomatni yakunlash va saqlash
  async finalizeAttendance(
    telegramId: string,
    lessonId: string,
    attendances: Array<{ studentId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; note?: string }>,
  ) {
    const res = await this.client.post(
      `/internal/bot/attendance/finalize/${telegramId}/${lessonId}`,
      { attendances },
    );
    return res.data;
  }
}

export const api = new ApiService();
