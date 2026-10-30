import { Bot } from 'grammy';
import { BotContext } from '../types.js';
import { api } from '../api.js';

export function registerLessonsHandler(bot: Bot<BotContext>) {
  bot.command('darslar', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const data = await api.getUpcomingLessons(telegramId);

      let msg = `📅 <b>Darslar jadvali va davomat</b>\n\n`;

      // 1. Bugungi darslar
      msg += `<b>🔔 Bugungi darslar:</b>\n`;
      if (data.today && data.today.length > 0) {
        for (const l of data.today) {
          msg += `• ⏰ <b>${l.time}</b> — ${l.courseName} (${l.groupName})\n`;
          msg += `  📍 Xona: ${l.room || 'Belgilanmagan'}\n`;
          if (l.status === 'CANCELLED') {
            msg += `  ❌ <i>Bekor qilingan: ${l.cancelReason || 'Sababsiz'}</i>\n`;
          }
        }
      } else {
        msg += `<i>Bugun darslar rejalashtirilmagan.</i>\n`;
      }
      msg += `\n`;

      // 2. Keyingi 7 kunlik darslar
      msg += `<b>🗓 Kelgusi darslar (7 kun):</b>\n`;
      if (data.upcoming && data.upcoming.length > 0) {
        for (const l of data.upcoming) {
          const dateStr = new Date(l.date).toLocaleDateString('uz-UZ', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
          });
          msg += `• ${dateStr} ${l.time} — ${l.courseName} (${l.groupName})\n`;
        }
      } else {
        msg += `<i>Kelgusi darslar mavjud emas.</i>\n`;
      }
      msg += `\n`;

      // 3. Oxirgi darslar davomati
      msg += `<b>📋 Oxirgi o‘tgan darslar davomati:</b>\n`;
      if (data.past && data.past.length > 0) {
        for (const l of data.past) {
          const dateStr = new Date(l.date).toLocaleDateString('uz-UZ');
          const attIcon =
            l.attendance === 'PRESENT'
              ? '✅ Keldi'
              : l.attendance === 'ABSENT'
                ? '❌ Kelmadi'
                : l.attendance === 'EXCUSED'
                  ? '⏸ Sababli'
                  : '❓ Belgilanmagan';
          msg += `• ${dateStr} — ${l.courseName}: <b>${attIcon}</b>\n`;
        }
      } else {
        msg += `<i>O‘tgan darslar tarixi mavjud emas.</i>\n`;
      }

      await ctx.reply(msg, { parse_mode: 'HTML' });
    } catch (err: any) {
      if (err.response?.status === 404) {
        await ctx.reply('Siz hali guruhlarga biriktirilmagansiz yoki ro‘yxatdan o‘tmagansiz.');
      } else {
        console.error('/darslar xatoligi:', err);
        await ctx.reply('⚠️ Darslar jadvalini yuklashda xatolik yuz berdi.');
      }
    }
  });
}
