import { Bot, session, webhookCallback } from 'grammy';
import express from 'express';
import { config } from './config.js';
import { BotContext, SessionData } from './types.js';
import { registerStartHandler } from './handlers/start.js';
import { registerBalanceHandler } from './handlers/balance.js';
import { registerLessonsHandler } from './handlers/lessons.js';
import { registerTeacherHandlers } from './handlers/teacher.js';
import { registerParentHandler } from './handlers/parent.js';

async function bootstrap() {
  if (!config.botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN muhit o‘zgaruvchisi topilmadi.');
    process.exit(1);
  }

  const bot = new Bot<BotContext>(config.botToken);

  // 1. In-memory Sessiya sozlamasi
  bot.use(
    session({
      initial: (): SessionData => ({
        step: null,
      }),
    }),
  );

  // 2. Handlerlarni ro'yxatga olish
  registerStartHandler(bot);
  registerBalanceHandler(bot);
  registerLessonsHandler(bot);
  registerTeacherHandlers(bot);
  registerParentHandler(bot);

  // 3. Bot xatoliklarini ushlash
  bot.catch((err) => {
    console.error('Telegram bot xatosi:', err.message, err.error);
  });

  // 4. Standart komandalar ro'yxatini belgilash
  try {
    await bot.api.setMyCommands([
      { command: 'start', description: 'Botni ishga tushirish va identifikatsiya' },
      { command: 'balans', description: 'To‘lov balansi va hisobi' },
      { command: 'darslar', description: 'Darslar jadvali va davomat' },
      { command: 'guruhlarim', description: 'O‘qituvchining faol guruhlari' },
      { command: 'davomat', description: 'Bugungi darslar uchun yo‘qlama' },
      { command: 'farzandlarim', description: 'Ota-ona uchun farzandlar holati' },
    ]);
  } catch (e: any) {
    console.warn('⚠️ Bot komandalarini o‘rnatib bo‘lmadi:', e.message);
  }

  // 5. Ishlash rejimini tanlash: Webhook yoki Long Polling
  if (config.webhookUrl) {
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        service: 'Edu Center Telegram Bot',
        mode: 'webhook',
        timestamp: new Date().toISOString(),
      });
    });

    // Webhook callback
    app.use(
      '/telegram/webhook',
      webhookCallback(bot, 'express', {
        secretToken: config.webhookSecretToken || undefined,
      }),
    );

    app.listen(config.port, async () => {
      console.log(`🚀 Telegram Bot Webhook server ${config.port}-portda ishlamoqda`);
      await bot.api.setWebhook(config.webhookUrl, {
        secret_token: config.webhookSecretToken || undefined,
      });
      console.log(`🔗 Webhook muvaffaqiyatli ulandi: ${config.webhookUrl}`);
    });
  } else {
    // Lokal ishlab chiqish uchun Polling rejimi
    console.log('⚡ Webhook URL ko‘rsatilmagan. Bot Long Polling rejimida ishga tushmoqda...');
    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Bot @${botInfo.username} sifatida muvaffaqiyatli ishga tushdi.`);
      },
    });
  }
}

bootstrap().catch((err) => {
  console.error('Fatal bot bootstrap error:', err);
});
