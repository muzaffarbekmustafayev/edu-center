import { Bot } from 'grammy';
import { BotContext } from '../types.js';
import { api } from '../api.js';

export function registerParentHandler(bot: Bot<BotContext>) {
  bot.command('farzandlarim', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const data = await api.getBalance(telegramId);
      if (data.role !== 'PARENT') {
        await ctx.reply('Ushbu komanda faqat ro‘yxatdan o‘tgan ota-onalar uchun mo‘ljallangan.');
        return;
      }

      let msg = `👨‍👩‍👦 <b>Farzandlaringiz ma'lumotlari:</b>\n\n`;

      if (!data.children || data.children.length === 0) {
        msg += `Sizga biriktirilgan farzandlar topilmadi.`;
      } else {
        for (const child of data.children) {
          msg += `👤 <b>Farzand:</b> ${child.studentName}\n`;
          if (child.cycles.length > 0) {
            for (const c of child.cycles) {
              msg += `  📚 ${c.courseName} (${c.groupName}): ${c.lessonsDone}/${c.lessonsRequired} dars\n`;
              const statusStr =
                c.status === 'PAID' ? '🟢 To‘langan' : c.status === 'OVERDUE' ? '🔴 Qarzdorlik' : '🟡 Kutilmoqda';
              msg += `  Holat: ${statusStr} (${c.amount.toLocaleString('uz-UZ')} so‘m)\n`;
            }
          } else {
            msg += `  <i>Kurslarga biriktirilmagan</i>\n`;
          }
          msg += `\n`;
        }
      }

      msg += `Darslar jadvalini ko‘rish uchun: /darslar\n`;
      msg += `Batafsil to‘lovlar balansi uchun: /balans`;

      await ctx.reply(msg, { parse_mode: 'HTML' });
    } catch (err: any) {
      if (err.response?.status === 404) {
        await ctx.reply('Siz hali tizimda ota-ona sifatida ro‘yxatdan o‘tmagansiz.');
      } else {
        console.error('/farzandlarim xatoligi:', err);
        await ctx.reply('⚠️ Farzandlar ma‘lumotlarini yuklashda xatolik yuz berdi.');
      }
    }
  });
}
