# Edu Center — Tizim Hujjatlari (Documentation)

Ushbu katalogda **Edu Center** o‘quv markazini boshqarish axborot tizimining to‘liq texnik spetsifikatsiyasi, arxitekturasi, ma’lumotlar bazasi sxemasi, biznes qoidalari, API spetsifikatsiyalari, Telegram bot mexanizmlari, Next.js PWA mijozi va cron vazifalari bo‘yicha hujjatlar jamlangan.

Loyiha bitta Git repozitoriyada (monorepo tuzilmasida) joylashgan bo‘lib, 3 ta asosiy dasturiy qism va hujjatlardan iborat:
- `server/` — NestJS REST API, Prisma ORM, Cron jobs (@nestjs/schedule)
- `bot/` — grammY Telegram webhook bot (**Faqat O‘zbek tilida**)
- `client/` — Next.js (App Router), Tailwind CSS (CDN), Radix UI, PWA (Admin + Teacher paneli)
- `documentation/` — Tizimning to‘liq arxitektura va texnik hujjatlari

---

## 📌 Asosiy Tizim Qoidalari (v1.4)

1. **O‘qituvchini qo‘shish va aniqlash**: O‘qituvchi Admin tomonidan veb-paneldan **Telegram ID** si bilan kiritiladi. Botga yozganida tizim uning Telegram ID si orqali darhol **O‘qituvchi** ekanligini taniydi (kontakt so‘ralmaydi).
2. **Botda avtomatik O‘quvchi roli va Ota-ona kontaktai**: Botga `/start` bosgan yangi foydalanuvchi avtomatik **O‘quvchi** deb qabul qilinadi. U o‘z raqamini yuboradi va unga **ota-onasining kontaktini ulashish** tugmasi chiqadi.
3. **Bitta mas'ul ota yoki ona**: Har bir farzand uchun tizimda **faqat bitta mas'ul ota yoki ona** biriktiriladi (`Student.parentId`).
4. **Oldindan to‘lov (Prepay)**: Har bir 12 darslik to‘lov sikli o‘sha darslar boshlanishidan oldin to‘lanadi.
5. **Kelsa va kelmasa ham dars hisoblanadi**: Dars o‘tgach, `PRESENT` yoki `ABSENT` bo‘lishidan qat'i nazar dars o‘tildi deb hisoblanadi va 12 darslik paketdan 1 dars sarflanadi (`lessonsDone++`).
6. **Darsga kelmaganda ota-onaga darhol xabar (`STUDENT_ABSENT`)**: O‘quvchi kelmagan deb belgilanganda (`ABSENT`), ota-onaga Telegram orqali shu zahotiyoq xabar yuboriladi.
7. **Dars boshlanganda yo‘qlama xabari**: Guruh jadvali bo‘yicha dars vaqti kelganda o‘qituvchining Telegramiga **"Yo‘qlamani boshlash"** tugmasi boradi.
8. **Ikki tomonlama eslatma**: To‘lov eslatmalari bir vaqtda **farzandga ham, uning mas'ul ota-onasiga ham** yetkaziladi.
9. **Bot tili**: Telegram bot **faqat O‘zbek tilida** ishlaydi.
10. **O‘qituvchi veb dashboardi**: O‘qituvchi o‘z panelida guruhlar ro‘yxati, guruh ichida o‘quvchilar ro‘yxati, o‘quvchi ustiga bosilganda esa uning ma'lumotlari va barcha darslar bo‘yicha to‘liq davomat tarixini ko‘radi.

---

## 📚 Hujjatlar Mundarijasi

| № | Fayl | Tavsif |
|---|---|---|
| 1 | [01-architecture-overview.md](./01-architecture-overview.md) | Tizim arxitekturasi, modullararo aloqa, texnologiyalar steki va ma'lumotlar oqimi |
| 2 | [02-database-schema.md](./02-database-schema.md) | PostgreSQL Prisma modeli, jadvallar, 1:1 ota-ona munosabati, enumlar va audit |
| 3 | [03-business-logic-rules.md](./03-business-logic-rules.md) | Prepay, 2 bepul dars, kelsa-kelmasa ham dars hisoblanishi, yo‘qlama boshlash |
| 4 | [04-api-specification.md](./04-api-specification.md) | REST API endpoints, Teacher Web API, Internal Auth (`link-telegram`), OpenAPI |
| 5 | [05-telegram-bot.md](./05-telegram-bot.md) | grammY webhook boti (faqat o‘zbekcha), /start, /balans, /darslar, /guruhlarim, yo‘qlama |
| 6 | [06-web-client-pwa.md](./06-web-client-pwa.md) | Next.js App Router, Tailwind CDN, Teacher dashboard, PWA (SW, Offline, Manifest) |
| 7 | [07-cron-jobs-scheduler.md](./07-cron-jobs-scheduler.md) | NestJS cron vazifalari, 90 kunlik dars generatsiyasi, 09:00 oldindan to‘lov eslatmasi |
| 8 | [08-notifications-i18n.md](./08-notifications-i18n.md) | Bildirishnomalar shablonlari (faqat o‘zbek tilidagi barcha xabarlar) |
| 9 | [09-security-roles.md](./09-security-roles.md) | Rollar (ADMIN, TEACHER), Row-level security, JWT, xavfsizlik va yagona ota-ona nazorati |
| 10 | [10-environment-deployment.md](./10-environment-deployment.md) | Muhit o‘zgaruvchilari (.env), lokal ishga tushirish, Docker va production deploy |
| 11 | [11-mvp-roadmap.md](./11-mvp-roadmap.md) | MVP chegaralari, standart qarorlar reestri (B1–B17, C1–C3) va keyingi bosqichlar |
