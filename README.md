# Edu Center — O‘quv Markazni Boshqarish Tizimi

Edu Center — o‘quv markazlari uchun o‘quvchilar, guruhlar, kurslar, davomat, oldindan to‘lovlar (12 darslik prepay sikli), darsga kelmaganda ota-onaga tezkor ogohlantirish, kirim-chiqim va avtomatik Telegram bildirishnomalarini boshqaruvchi to‘liq avtomatlashtirilgan axborot tizimi.

Loyiha yagona Git repozitoriyasida (Monorepo) joylashgan bo‘lib, 3 ta asosiy modul va to‘liq texnik hujjatlardan iborat.

---

## 📌 Asosiy Tizim Qoidalari (v1.4)

1. **O‘qituvchini qo‘shish va aniqlash**: O‘qituvchi Admin tomonidan veb-paneldan **Telegram ID** si bilan kiritiladi. Botga yozganida tizim uning Telegram ID si orqali darhol **O‘qituvchi** ekanligini taniydi.
2. **Botda avtomatik O‘quvchi roli va Ota-ona kontaktai**: Botga `/start` bosgan yangi foydalanuvchi avtomatik **O‘quvchi** deb qabul qilinadi. U o‘z raqamini yuboradi va unga **ota-onasining kontaktini ulashish** tugmasi chiqadi.
3. **Bitta mas'ul ota yoki ona**: Har bir farzand uchun tizimda **faqat bitta mas'ul ota yoki ona** biriktiriladi (`Student.parentId`).
4. **Oldindan to‘lov (Prepay)**: To‘lov darslar o‘tilishidan oldin (12 ta darslik paket uchun) qabul qilinadi.
5. **Kelsa va kelmasa ham dars hisoblanadi**: Dars o‘tgach, o‘quvchi kelgan (`PRESENT`) yoki kelmagan (`ABSENT`) bo‘lishidan qat'i nazar dars o‘tildi deb hisoblanadi va 12 darslik to‘lov siklidan 1 dars sarflanadi (`lessonsDone++`).
6. **Darsga kelmaganda ota-onaga darhol xabar (`STUDENT_ABSENT`)**: O‘quvchi darsga kelmagan deb belgilanganda (`ABSENT`), ota-onaning Telegram hisobiga shu zahotiyoq xabar yuboriladi.
7. **Dars boshlanganda yo‘qlama xabari**: Guruh jadvali bo‘yicha dars vaqti kelganda o‘qituvchining Telegramiga **"Yo‘qlamani boshlash"** tugmasi boradi.
8. **Ikki tomonlama eslatmalar**: To‘lov eslatmalari bir vaqtda **ham farzandga, ham mas'ul ota-onaga** jo‘natiladi.
9. **Bot tili**: Telegram bot **faqat O‘zbek tilida** ishlaydi.
10. **O‘qituvchi veb dashboardi**: O‘qituvchi veb-panelda o‘z guruhlari, guruh o‘quvchilari va o‘quvchi bosilganda uning to‘liq davomat tarixini ko‘ra oladi.

---

## 📁 Repozitoriya Tuzilmasi

```text
edu-center/
├── bot/               # grammY Telegram Webhook boti (Faqat O‘zbek tilida, TypeScript)
├── client/            # Next.js App Router boshqaruv paneli (Admin + Teacher) + Tailwind (CDN) + PWA
├── documentation/     # Tizimning to‘liq texnik arxitektura va spetsifikatsiya hujjatlari (.md)
├── server/            # NestJS REST API, Prisma ORM va @nestjs/schedule Cron vazifalari
└── README.md          # Ushbu umumiy tanishtiruv fayli
```

---

## 📚 Tizim Hujjatlari (Documentation)

Barcha texnik arxitektura, ma'lumotlar bazasi modellari, biznes mantiq qoidalari va API spetsifikatsiyalari [`documentation/`](./documentation/) papkasida modullar bo‘yicha to‘liq yoritilgan:

1. [01. Tizim Arxitekturasi va Umumiy Ko‘rinish](./documentation/01-architecture-overview.md)
2. [02. Ma’lumotlar Bazasi Sxemasi (Prisma & PostgreSQL)](./documentation/02-database-schema.md)
3. [03. Biznes Qoidalar va Algoritmlar (Prepay, 2 bepul dars, kelsa-kelmasa dars hisoblanishi)](./documentation/03-business-logic-rules.md)
4. [04. REST API va Ichki API Spetsifikatsiyasi (Teacher Web API, /start oqimi)](./documentation/04-api-specification.md)
5. [05. Telegram Bot Spetsifikatsiyasi (grammY — Faqat O‘zbekcha, Ota-ona kontaktai)](./documentation/05-telegram-bot.md)
6. [06. Veb Mijoz va PWA Spetsifikatsiyasi (Teacher Dashboard, PWA)](./documentation/06-web-client-pwa.md)
7. [07. Cron Vazifalar va Rejalashtiruvchi (@nestjs/schedule)](./documentation/07-cron-jobs-scheduler.md)
8. [08. Bildirishnomalar Shablonlari (Faqat O‘zbek tilida)](./documentation/08-notifications-i18n.md)
9. [09. Xavfsizlik, Rollar va Ruxsatlar (RBAC, Row-Level Security)](./documentation/09-security-roles.md)
10. [10. Muhit O‘zgaruvchilari va Joylashtirish (.env, Docker, Nginx)](./documentation/10-environment-deployment.md)
11. [11. MVP Ko‘lami va Yo‘l Xaritasi](./documentation/11-mvp-roadmap.md)
