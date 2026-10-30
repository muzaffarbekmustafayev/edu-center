import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../types.js';
import { api } from '../api.js';

// Darslar bo'yicha vaqtinchalik yo'qlama xotirasi: lessonId -> { studentId: 'PRESENT' | 'ABSENT' | 'EXCUSED' }
const attendanceDrafts = new Map<string, Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'>>();

export function registerTeacherHandlers(bot: Bot<BotContext>) {
  // 1. /guruhlarim komandasi
  bot.command('guruhlarim', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const groups = await api.getTeacherGroups(telegramId);

      if (!groups || groups.length === 0) {
        await ctx.reply('Sizga biriktirilgan faol guruhlar mavjud emas.');
        return;
      }

      let msg = `📚 <b>Sizning faol guruhlaringiz:</b>\n\n`;

      const keyboard = new InlineKeyboard();

      for (const g of groups) {
        const todayMark = g.hasLessonToday ? '🔥 (Bugun dars bor)' : '';
        msg += `• <b>${g.name}</b> ${todayMark}\n`;
        msg += `  📖 Kurs: ${g.courseName}\n`;
        msg += `  👥 O‘quvchilar: ${g.studentCount} ta\n`;
        msg += `  🗓 Jadval: ${g.schedule}\n\n`;

        keyboard.text(`📋 ${g.name} tafsiloti`, `group_detail:${g.id}`).row();
      }

      await ctx.reply(msg, { reply_markup: keyboard, parse_mode: 'HTML' });
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        await ctx.reply('Siz o‘qituvchi sifatida topilmadingiz.');
      } else {
        console.error('/guruhlarim xatoligi:', err);
        await ctx.reply('⚠️ Guruhlarni yuklashda xatolik yuz berdi.');
      }
    }
  });

  // 2. Guruh tafsiloti callback
  bot.callbackQuery(/^group_detail:(.+)$/, async (ctx) => {
    const groupId = ctx.match[1];
    const telegramId = String(ctx.from.id);

    try {
      const g = await api.getTeacherGroupDetail(telegramId, groupId);
      let text = `📚 <b>Guruh: ${g.name}</b>\n\n`;
      text += `📖 Kurs: ${g.courseName}\n`;
      text += `💰 Narxi: ${g.coursePrice?.toLocaleString('uz-UZ')} so‘m\n`;
      text += `🗓 Jadval: ${g.schedule}\n`;
      text += `👥 Jami a'zolar: ${g.studentCount} ta\n`;
      text += `  • Faol: ${g.activeCount} ta\n`;
      text += `  • To‘xtatilgan: ${g.suspendedCount} ta\n`;
      text += `  • Qarzdorlar: ${g.debtorCount} ta\n`;

      await ctx.answerCallbackQuery();
      await ctx.reply(text, { parse_mode: 'HTML' });
    } catch (err) {
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi', show_alert: true });
    }
  });

  // 3. /davomat komandasi — Bugungi darslar uchun yo'qlama
  bot.command('davomat', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const groups = await api.getTeacherGroups(telegramId);
      const todayGroups = groups.filter((g: any) => g.hasLessonToday);

      if (todayGroups.length === 0) {
        await ctx.reply('Bugun sizda o‘tiladigan darslar jadvalda belgilanmagan.');
        return;
      }

      const keyboard = new InlineKeyboard();
      for (const g of todayGroups) {
        keyboard.text(`📋 ${g.name} — Yo‘qlama`, `start_att_group:${g.id}`).row();
      }

      await ctx.reply(
        '🔔 <b>Bugungi darslar uchun yo‘qlama:</b>\nIltimos, guruhni tanlang:',
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    } catch (err) {
      console.error('/davomat xatoligi:', err);
      await ctx.reply('⚠️ Yo‘qlamani ochishda xatolik yuz berdi.');
    }
  });

  // 4. Guruh bo'yicha yo'qlama boshlash callback
  bot.callbackQuery(/^start_att_group:(.+)$/, async (ctx) => {
    const groupId = ctx.match[1];
    const telegramId = String(ctx.from.id);

    try {
      const students = await api.getGroupStudents(telegramId, groupId);

      if (!students || students.length === 0) {
        await ctx.answerCallbackQuery({ text: 'Guruhda faol o‘quvchilar yo‘q.', show_alert: true });
        return;
      }

      // Standart holatda barcha o'quvchilarga PRESENT (Keldi) qo'yamiz
      const draftKey = `${groupId}`;
      const currentDraft = attendanceDrafts.get(draftKey) || {};
      for (const s of students) {
        if (!currentDraft[s.studentId]) {
          currentDraft[s.studentId] = 'PRESENT';
        }
      }
      attendanceDrafts.set(draftKey, currentDraft);

      const keyboard = renderAttendanceKeyboard(groupId, students, currentDraft);

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📋 <b>Yo‘qlama oynasi:</b>\n\n` +
          `O‘quvchilar holatini belgilang va yakunlash uchun <b>[💾 Saqlash]</b> tugmasini bosing:\n` +
          `<i>(Eslatma: Darsga kelmagan deb belgilangan o‘quvchilarning ota-onasiga shu zahoti xabar yuboriladi)</i>`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    } catch (err) {
      console.error('start_att_group error:', err);
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi', show_alert: true });
    }
  });

  // 5. O'quvchi holatini almashtirish (Toggle: PRESENT -> ABSENT -> EXCUSED -> PRESENT)
  bot.callbackQuery(/^toggle_att:([^:]+):([^:]+)$/, async (ctx) => {
    const groupId = ctx.match[1];
    const studentId = ctx.match[2];
    const telegramId = String(ctx.from.id);

    const draftKey = groupId;
    const currentDraft = attendanceDrafts.get(draftKey) || {};
    const currentStatus = currentDraft[studentId] || 'PRESENT';

    let nextStatus: 'PRESENT' | 'ABSENT' | 'EXCUSED' = 'PRESENT';
    if (currentStatus === 'PRESENT') nextStatus = 'ABSENT';
    else if (currentStatus === 'ABSENT') nextStatus = 'EXCUSED';
    else nextStatus = 'PRESENT';

    currentDraft[studentId] = nextStatus;
    attendanceDrafts.set(draftKey, currentDraft);

    try {
      const students = await api.getGroupStudents(telegramId, groupId);
      const keyboard = renderAttendanceKeyboard(groupId, students, currentDraft);

      await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (err) {
      await ctx.answerCallbackQuery();
    }
  });

  // 6. Cron orqali kelgan to'g'ridan-to'g'ri dars yo'qlamasi [📋 Yo'qlamani boshlash]
  bot.callbackQuery(/^start_lesson_att:([^:]+):([^:]+)$/, async (ctx) => {
    const lessonId = ctx.match[1];
    const groupId = ctx.match[2];
    const telegramId = String(ctx.from.id);

    try {
      const students = await api.getGroupStudents(telegramId, groupId);
      if (!students || students.length === 0) {
        await ctx.answerCallbackQuery({ text: 'Guruhda o‘quvchilar yo‘q.', show_alert: true });
        return;
      }

      const currentDraft: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'> = {};
      for (const s of students) {
        currentDraft[s.studentId] = 'PRESENT';
      }
      attendanceDrafts.set(lessonId, currentDraft);

      const keyboard = renderAttendanceKeyboardForLesson(lessonId, students, currentDraft);

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📋 <b>Dars yo‘qlamasi:</b>\n\n` +
          `O‘quvchilar ro‘yxati (boshlang‘ich: barchasi Keldi).\n` +
          `Kelmaganlarni ❌ qilib o‘zgartiring va <b>[💾 Saqlash]</b> tugmasini bosing:`,
        { reply_markup: keyboard, parse_mode: 'HTML' },
      );
    } catch (err) {
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi', show_alert: true });
    }
  });

  // 7. Dars yo'qlamasida o'quvchini toggle qilish
  bot.callbackQuery(/^tgl_l:([^:]+):([^:]+)$/, async (ctx) => {
    const lessonId = ctx.match[1];
    const studentId = ctx.match[2];

    const currentDraft = attendanceDrafts.get(lessonId) || {};
    const cur = currentDraft[studentId] || 'PRESENT';

    let nxt: 'PRESENT' | 'ABSENT' | 'EXCUSED' = 'PRESENT';
    if (cur === 'PRESENT') nxt = 'ABSENT';
    else if (cur === 'ABSENT') nxt = 'EXCUSED';
    else nxt = 'PRESENT';

    currentDraft[studentId] = nxt;
    attendanceDrafts.set(lessonId, currentDraft);

    await ctx.answerCallbackQuery();
  });

  // 8. Yo'qlamani yakunlash va saqlash [💾 Saqlash]
  bot.callbackQuery(/^save_att:(.+)$/, async (ctx) => {
    const targetId = ctx.match[1]; // groupId yoki lessonId
    const telegramId = String(ctx.from.id);

    const draft = attendanceDrafts.get(targetId);
    if (!draft) {
      await ctx.answerCallbackQuery({ text: 'Yo‘qlama ma‘lumotlari topilmadi.', show_alert: true });
      return;
    }

    try {
      const attendances = Object.entries(draft).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.finalizeAttendance(telegramId, targetId, attendances);

      attendanceDrafts.delete(targetId);

      const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
      const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `✅ <b>Yo‘qlama muvaffaqiyatli saqlandi!</b>\n\n` +
          `• Qatnashdi: ${presentCount} ta\n` +
          `• Kelmadi: ${absentCount} ta\n\n` +
          `<i>ℹ️ Kelmagan o‘quvchilarning mas'ul ota-onalariga zudlik bilan Telegram orqali ogohlantirish xabari yetkazildi.</i>`,
        { parse_mode: 'HTML' },
      );
    } catch (err: any) {
      console.error('finalizeAttendance error:', err);
      const errorMsg = err.response?.data?.message || 'Yo‘qlamani saqlashda xatolik yuz berdi.';
      await ctx.answerCallbackQuery({ text: String(errorMsg), show_alert: true });
    }
  });
}

function renderAttendanceKeyboard(
  groupId: string,
  students: Array<{ studentId: string; studentName: string }>,
  draft: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'>,
) {
  const keyboard = new InlineKeyboard();

  for (const s of students) {
    const status = draft[s.studentId] || 'PRESENT';
    const statusIcon = status === 'PRESENT' ? '✅ Keldi' : status === 'ABSENT' ? '❌ Kelmadi' : '⏸ Sababli';

    keyboard
      .text(`${s.studentName}: ${statusIcon}`, `toggle_att:${groupId}:${s.studentId}`)
      .row();
  }

  keyboard.text('💾 Barchasini saqlash', `save_att:${groupId}`).row();
  return keyboard;
}

function renderAttendanceKeyboardForLesson(
  lessonId: string,
  students: Array<{ studentId: string; studentName: string }>,
  draft: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'>,
) {
  const keyboard = new InlineKeyboard();

  for (const s of students) {
    const status = draft[s.studentId] || 'PRESENT';
    const statusIcon = status === 'PRESENT' ? '✅ Keldi' : status === 'ABSENT' ? '❌ Kelmadi' : '⏸ Sababli';

    keyboard.text(`${s.studentName}: ${statusIcon}`, `tgl_l:${lessonId}:${s.studentId}`).row();
  }

  keyboard.text('💾 Barchasini saqlash', `save_att:${lessonId}`).row();
  return keyboard;
}
