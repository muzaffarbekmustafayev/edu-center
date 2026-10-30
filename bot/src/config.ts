import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  webhookUrl: process.env.WEBHOOK_URL || '',
  webhookSecretToken: process.env.WEBHOOK_SECRET_TOKEN || '',
  serverApiUrl: process.env.SERVER_API_URL || 'http://localhost:3000',
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal-api-secret-key-123456789',
  timezone: process.env.TZ || 'Asia/Tashkent',
};
