# 10. Muhit O‘zgaruvchilari va Joylashtirish (Environment & Deployment)

Ushbu hujjatda **Edu Center** tizimining har bir moduli uchun muhit o‘zgaruvchilari (`.env`), lokal muhitda ishlab chiqish tartibi, Docker Compose arxitekturasi va ishlab chiqarishga (Production) joylashtirish bo‘yicha to‘liq qo‘llanma keltirilgan.

---

## 1. Muhit O‘zgaruvchilari (`.env` Konfiguratsiyalari)

Loyiha monorepo formatida bo‘lgani uchun har bir modul o‘zining `.env` fayliga ega bo‘ladi.

### 1.1. Server Konfiguratsiyasi (`server/.env`)

```env
# Server Porti va Rejimi
PORT=3000
NODE_ENV=production

# Ma'lumotlar Bazasi (PostgreSQL)
DATABASE_URL="postgresql://postgres:secure_password@localhost:5432/edu_center?schema=public&sslmode=prefer"

# Vaqt Mintaqasi
TZ=Asia/Tashkent

# JWT Xavfsizlik Kalitlari
JWT_SECRET="super-secret-jwt-access-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-change-in-production-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"

# Ichki Aloqa Kaliti (Bot va Server o'rtasida)
INTERNAL_API_KEY="internal-api-secret-key-123456789"

# Telegram Bot API (To'g'ridan-to'g'ri xabarnomalar uchun)
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"

# CORS Ruxsat Berilgan Domenlar (vergul bilan ajratilgan)
ALLOWED_ORIGINS="https://educenter.uz,https://admin.educenter.uz"
```

---

### 1.2. Telegram Bot Konfiguratsiyasi (`bot/.env`)

```env
# Bot Ishlash Rejimi va Port
PORT=3001
NODE_ENV=production

# Telegram Bot Tokeni
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"

# Webhook Xavfsizlik Sozlamalari
WEBHOOK_URL="https://bot.educenter.uz/telegram/webhook"
WEBHOOK_SECRET_TOKEN="telegram-webhook-secret-token-random-chars"

# Asosiy Server (Internal API) Manzili
SERVER_API_URL="http://localhost:3000"
INTERNAL_API_KEY="internal-api-secret-key-123456789"

# Vaqt Mintaqasi
TZ=Asia/Tashkent
```

---

### 1.3. Mijoz (Client / Next.js) Konfiguratsiyasi (`client/.env`)

```env
# Asosiy API Manzili (Brauzer va PWA uchun ochiq)
NEXT_PUBLIC_API_URL="https://api.educenter.uz"

# Ilova Nomi
NEXT_PUBLIC_APP_NAME="Edu Center"

# Ishlash Muhiti
NODE_ENV=production
```

---

## 2. Mahalliy Ishlab Chiqish (Local Development Setup)

### 2.1. Talablar
- Node.js LTS (v20+)
- npm yoki pnpm
- Docker va Docker Compose (PostgreSQL uchun)

### 2.2. Qadam-baqam ishga tushirish

1. **Repozitoriyani klonlash va bazani ishga tushirish**:
   ```bash
   git clone https://github.com/your-username/edu-center.git
   cd edu-center
   docker compose up -d postgres
   ```

2. **Serverni tayyorlash va migratsiyalarni yurgizish**:
   ```bash
   cd server
   npm install
   npx prisma migrate dev --name init
   npx prisma db seed # Standart admin va boshlang'ich sozlamalarni yuklaydi
   npm run start:dev
   ```

3. **Telegram botni ishga tushirish**:
   ```bash
   cd ../bot
   npm install
   # Lokal testlash uchun polling rejimidan yoki ngrok orqali webhookdan foydalanish mumkin
   npm run start:dev
   ```

4. **Next.js mijoz panelini ishga tushirish**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Brauzerda `http://localhost:3000` ochiladi.

---

## 3. Ishlab Chiqarishga Joylashtirish (Production Docker Compose)

Loyiha ildizidagi `docker-compose.prod.yml` orqali barcha servislar bitta tarmoqda to‘liq avtonom ishga tushiriladi:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: edu_center_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: edu_center
      TZ: Asia/Tashkent
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - edu_internal_net

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: edu_center_server
    restart: always
    environment:
      DATABASE_URL: "postgresql://postgres:${DB_PASSWORD}@postgres:5432/edu_center?schema=public"
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      INTERNAL_API_KEY: ${INTERNAL_API_KEY}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TZ: Asia/Tashkent
    depends_on:
      - postgres
    networks:
      - edu_internal_net
      - edu_public_net

  bot:
    build:
      context: ./bot
      dockerfile: Dockerfile
    container_name: edu_center_bot
    restart: always
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      WEBHOOK_URL: ${WEBHOOK_URL}
      WEBHOOK_SECRET_TOKEN: ${WEBHOOK_SECRET_TOKEN}
      SERVER_API_URL: "http://server:3000"
      INTERNAL_API_KEY: ${INTERNAL_API_KEY}
      TZ: Asia/Tashkent
    depends_on:
      - server
    networks:
      - edu_internal_net
      - edu_public_net

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: edu_center_client
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    networks:
      - edu_public_net

networks:
  edu_internal_net:
    internal: true
  edu_public_net:
    driver: bridge

volumes:
  postgres_data:
```

---

## 4. Nginx Reverse Proxy va SSL Sertifikatlari

Tashqi so‘rovlarni to‘g‘ri marshrutlash va PWA uchun majburiy bo‘lgan HTTPS protokolini ta'minlash uchun Nginx konfiguratsiyasi:

```nginx
# Client (Next.js PWA)
server {
    server_name educenter.uz;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # PWA Service Worker keshlash qoidalari
    location /sw.js {
        proxy_pass http://localhost:3002;
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_pragma;
        proxy_cache_revalidate on;
        expires off;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/educenter.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/educenter.uz/privkey.pem;
}

# Backend REST API
server {
    server_name api.educenter.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/api.educenter.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.educenter.uz/privkey.pem;
}

# Telegram Webhook
server {
    server_name bot.educenter.uz;

    location /telegram/webhook {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Telegram-Bot-Api-Secret-Token $http_x_telegram_bot_api_secret_token;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/bot.educenter.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.educenter.uz/privkey.pem;
}
```

---

## 5. Zaxira Nusxalash (Database Backup)

PostgreSQL ma'lumotlar bazasi har kecha avtomatik zaxiralanadi (`cron` orqali):
```bash
# Har kuni soat 04:00 da zaxira olish
0 4 * * * pg_dump -U postgres edu_center | gzip > /backups/edu_center_$(date +\%F).sql.gz
```
Zaxira nusxalari kamida 30 kun saqlanadi.
