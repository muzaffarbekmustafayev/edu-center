import { Bot, Keyboard } from 'grammy';
import { BotContext } from '../types.js';
import { api } from '../api.js';

export function registerStartHandler(bot: Bot<BotContext>) {
  // 1. /start komandasi
  bot.command('start', async (ctx) => {
    const telegramId = String(ctx.from?.id);
    if (!telegramId) return;

    try {
      const user = await api.checkUserByTelegramId(telegramId);

      // 1-HOLAT: O'qituvchi (Admin paneldan Telegram ID si kiritilgan)
      if (user && user.role === 'TEACHER') {
        await ctx.reply(
          `Assalomu alaykum, <b>${user.name}</b> (O‘qituvchi)!\n\n` +
            `Siz tizimda o‘qituvchi sifatida muvaffaqiyatli aniqlandingiz.\n\n` +
            `📋 Guruhlaringiz: /guruhlarim\n` +
            `✅ Bugungi yo‘qlama: /davomat`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 2-HOLAT: Admin
      if (user && user.role === 'ADMIN') {
        await ctx.reply(
          `Assalomu alaykum, <b>${user.name}</b> (Administrator)!\n\n` +
            `Siz Edu Center boshqaruv tizimi administratorisiz.`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 3-HOLAT: Allaqachon ro'yxatdan o'tgan O'quvchi
      if (user && user.role === 'STUDENT') {
        await ctx.reply(
          `Xush kelibsiz, <b>${user.name}</b>!\n\n` +
            `💳 Balans va to‘lovlar: /balans\n` +
            `📅 Dars jadvali: /darslar`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 4-HOLAT: Allaqachon ro'yxatdan o'tgan Ota-ona
      if (user && user.role === 'PARENT') {
        await ctx.reply(
          `Assalomu alaykum, <b>${user.name}</b>!\n\n` +
            `👨‍👩‍👦 Farzandlaringiz holati: /farzandlarim\n` +
            `💳 To‘lovlar balansi: /balans\n` +
            `📅 Darslar jadvali: /darslar`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 5-HOLAT: Yangi foydalanuvchi — ROLI AVTOMATIK O'QUVCHI BO'LADI
      const ownKeyboard = new Keyboard()
        .requestContact('📱 O‘z telefon raqamimni yuborish')
        .resized()
        .oneTime();

      ctx.session.step = 'AWAITING_STUDENT_CONTACT';

      await ctx.reply(
        `Assalomu alaykum! <b>Edu Center</b> botiga xush kelibsiz.\n\n` +
          `Siz o‘quvchi sifatida ro‘yxatdan o‘tmoqdasiz.\n` +
          `Iltimos, pastdagi tugma orqali o‘z telefon raqamingizni yuboring:`,
        { reply_markup: ownKeyboard, parse_mode: 'HTML' },
      );
    } catch (err) {
      console.error('/start xatoligi:', err);
      await ctx.reply('⚠️ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.');
    }
  });

  // 2. Kontakt xabari kelganda (2 bosqichli ro'yxatdan o'tish)
  bot.on('message:contact', async (ctx) => {
    const contact = ctx.message.contact;
    const fromId = ctx.from.id;
    const currentStep = ctx.session.step;

    // 1-BOSQICH: O'quvchi o'z telefon raqamini yubordi
    if (currentStep === 'AWAITING_STUDENT_CONTACT') {
      if (contact.user_id && contact.user_id !== fromId) {
        await ctx.reply(
          '❌ Iltimos, pastdagi [📱 O‘z telefon raqamimni yuborish] tugmasini bosing.',
        );
        return;
      }

      ctx.session.studentPhone = normalizePhone(contact.phone_number);
      ctx.session.studentName = `${ctx.from.first_name} ${ctx.from.last_name ?? ''}`.trim();
      ctx.session.step = 'AWAITING_PARENT_CONTACT';

      const parentKeyboard = new Keyboard()
        .requestContact('👨‍👩‍👦 Ota-onam kontaktini ulashish')
        .resized()
        .oneTime();

      await ctx.reply(
        `Rahmat! Endi eslatmalar va to‘lov ma'lumotlari borishi uchun ` +
          `ota yoki onangizning kontaktini pastdagi tugma orqali ulashing:\n\n` +
          `<i>(yoki ota-onangizning telefon raqamini +998901234567 ko‘rinishida yozib yuboring)</i>`,
        { reply_markup: parentKeyboard, parse_mode: 'HTML' },
      );
      return;
    }

    // 2-BOSQICH: Ota-ona kontaktai tugma orqali kelganda
    if (currentStep === 'AWAITING_PARENT_CONTACT') {
      const parentPhone = normalizePhone(contact.phone_number);
      const parentName = `${contact.first_name} ${contact.last_name ?? ''}`.trim() || 'Ota-ona';

      await finishStudentRegistration(ctx, parentPhone, parentName);
    }
  });

  // 3. Ota-ona raqami matn sifatida yozib yuborilganda
  bot.on('message:text', async (ctx, next) => {
    if (ctx.message.text.startsWith('/')) return next();

    if (ctx.session.step === 'AWAITING_PARENT_CONTACT') {
      const rawText = ctx.message.text.trim();
      const parentPhone = normalizePhone(rawText);

      if (!/^\+998\d{9}$/.test(parentPhone)) {
        await ctx.reply('❌ Telefon raqam noto‘g‘ri kiritildi. Namuna: +998901234567');
        return;
      }

      await finishStudentRegistration(ctx, parentPhone, 'Ota-ona');
      return;
    }

    return next();
  });
}

async function finishStudentRegistration(ctx: BotContext, parentPhone: string, parentName: string) {
  try {
    const res = await api.registerStudentWithParent({
      studentTelegramId: String(ctx.from!.id),
      studentPhone: ctx.session.studentPhone || '',
      studentName: ctx.session.studentName || `${ctx.from!.first_name}`,
      parentPhone,
      parentName,
    });

    ctx.session.step = null;

    await ctx.reply(
      `🎉 <b>Tabriklaymiz, ${res.studentName}!</b>\n\n` +
        `Siz tizimga muvaffaqiyatli kiritildingiz.\n` +
        `Ota-onangiz raqami (${parentPhone}) biriktirildi.\n\n` +
        `💳 /balans — to‘lovlar balansi\n` +
        `📅 /darslar — dars jadvali`,
      { reply_markup: { remove_keyboard: true }, parse_mode: 'HTML' },
    );
  } catch (err) {
    console.error('Ro‘yxatdan o‘tishda xatolik:', err);
    await ctx.reply(
      '⚠️ Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos, ma‘muriyatga murojaat qiling.',
    );
  }
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}
