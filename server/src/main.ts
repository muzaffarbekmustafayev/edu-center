import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Asosiy API prefiksi
  app.setGlobalPrefix('api/v1');

  // 2. CORS sozlamalari
  const allowedOriginsStr =
    configService.get<string>('ALLOWED_ORIGINS') ||
    'http://localhost:3000,http://localhost:3001,http://localhost:3002';
  const allowedOrigins = allowedOriginsStr.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Brauzersiz yoki bir xil manbadagi so'rovlarga ruxsat berish
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('CORS orqali taqiqlangan manba'));
      }
    },
    credentials: true,
  });

  // 3. Global validatsiya
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Global xatoliklarni ushlovchi filtr
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Swagger Hujjatlashtirish
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Edu Center API')
    .setDescription('O‘quv markazni boshqarish axborot tizimining to‘liq REST API spetsifikatsiyasi')
    .setVersion('1.4')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Internal-Key', in: 'header' }, 'InternalKey')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // OpenAPI JSON export endpointi
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Edu Center Server ishga tushdi: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger hujjatlari: http://localhost:${port}/api/docs`);
  console.log(`📋 OpenAPI JSON: http://localhost:${port}/api-json`);
}

await bootstrap();
