import { Bot } from 'grammy';
import { BotContext } from '../types.js';
import { api } from '../api.js';

export function registerBalanceHandler(bot: Bot<BotContext>) {
  bot.command('balans', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const data = await api.getBalance(telegramId);

      if (data.role === 'STUDENT') {
        let msg = `💳 <b>Sizning to‘lovlar balansingiz</b>\n\n`;
        msg += `👤 O‘quvchi: <b>${data.studentName}</b>\n`;

        if (data.cycles && data.cycles.length > 0) {
          msg += `\n<b>📚 Faol kurslar va darslar hisobi:</b>\n`;
          for (const c of data.cycles) {
            const statusIcon =
              c.status === 'PAID' ? '🟢 To‘langan' : c.status === 'OVERDUE' ? '🔴 Qarzdorlik' : '🟡 Kutilmoqda';
            msg += `• <b>${c.courseName}</b> (${c.groupName})\n`;
            msg += `   Sikl #${c.cycleNo}: ${c.lessonsDone}/${c.lessonsRequired} dars o‘tildi\n`;
            msg += `   Holati: ${statusIcon} (${c.amount.toLocaleString('uz-UZ')} so‘m)\n`;
          }
        } else {
          msg += `\nHozircha faol to‘lov sikllari mavjud emas.\n`;
        }

        if (data.totalDebt > 0) {
          msg += `\n⚠️ <b>Umumiy qarzdorlik:</b> ${data.totalDebt.toLocaleString('uz-UZ')} so‘m\n`;
          msg += `<i>Iltimos, darslar uzluksizligi uchun to‘lovni o‘z vaqtida amalga oshiring.</i>\n`;
        } else {
          msg += `\n✅ <b>Qarzdorlik yo‘q!</b> Barcha to‘lovlar o‘z vaqtida to‘langan.\n`;
        }

        if (data.recentPayments && data.recentPayments.length > 0) {
          msg += `\n<b>🧾 Oxirgi to‘lovlar:</b>\n`;
          for (const p of data.recentPayments) {
            const dateStr = new Date(p.paidAt).toLocaleDateString('uz-UZ');
            msg += `• ${p.courseName}: ${p.amount.toLocaleString('uz-UZ')} so‘m (${dateStr})\n`;
          }
        }

        await ctx.reply(msg, { parse_mode: 'HTML' });
        return;
      }

      if (data.role === 'PARENT') {
        let msg = `👨‍👩‍👦 <b>Farzandlaringiz to‘lov balansi</b>\n\n`;
        msg += `Hurmatli <b>${data.parentName}</b>,\n\n`;

        for (const child of data.children) {
          msg += `👤 <b>${child.studentName}:</b>\n`;
          if (child.cycles.length === 0) {
            msg += `   <i>Faol to‘lov sikli yo‘q</i>\n`;
          } else {
            for (const c of child.cycles) {
              const statusIcon =
                c.status === 'PAID' ? '🟢 To‘langan' : c.status === 'OVERDUE' ? '🔴 Kechikkan' : '🟡 Kutilmoqda';
              msg += `   • ${c.courseName} (${c.groupName}): ${c.lessonsDone}/${c.lessonsRequired} dars\n`;
              msg += `     Holat: ${statusIcon} (${c.amount.toLocaleString('uz-UZ')} so‘m)\n`;
            }
          }
          msg += `\n`;
        }

        if (data.totalDebt > 0) {
          msg += `⚠️ <b>Jami to‘lanishi kerak:</b> ${data.totalDebt.toLocaleString('uz-UZ')} so‘m\n`;
        } else {
          msg += `✅ <b>Qarzdorlik yo‘q!</b> Rahmat.\n`;
        }

        await ctx.reply(msg, { parse_mode: 'HTML' });
        return;
      }

      await ctx.reply('⚠️ Ma‘lumot topilmadi.');
    } catch (err: any) {
      if (err.response?.status === 404) {
        await ctx.reply('Siz hali tizimda ro‘yxatdan o‘tmagansiz. /start bosing.');
      } else {
        console.error('/balans xatoligi:', err);
        await ctx.reply('⚠️ Balansni yuklashda xatolik yuz berdi.');
      }
    }
  });
}
