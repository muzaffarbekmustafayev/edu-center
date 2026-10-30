# 11. MVP Ko‘lami va Yo‘l Xaritasi (MVP Scope & Roadmap)

Ushbu hujjatda **Edu Center** loyihasining 1-bosqich (MVP) doirasi, barcha savollar bo‘yicha qabul qilingan yakuniy standart qarorlar (oldindan to‘lov, bitta ota-ona ulanishi, darsga kelmaganda tezkor xabar, kelsa-kelmasa ham dars hisoblanishi va bot faqat o‘zbek tilida ekanligi) keltirilgan.

---

## 1. MVP (1-bosqich) Doirasi

### 1.1. Backend va Mantiq (`server`)
- ✅ Admin va O‘qituvchi autentifikatsiyasi (JWT Access + Refresh token, Role Guard).
- ✅ Asosiy modellar CRUD: Xodimlar, O‘quvchilar, Ota-onalar, Kurslar, Guruhlar.
- ✅ **Bitta mas'ul ota-ona**: Har bir o‘quvchiga bitta ota yoki ona biriktirilishi (`Student.parentId`).
- ✅ **Oldindan to‘lov (Prepay)**: 12 darslik to‘lov sikllarini darslar boshlanishidan oldin to‘lash tizimi.
- ✅ **Kelsa va kelmasa ham dars hisoblanishi**: `PRESENT` va `ABSENT` har ikkalasida ham 12 darslik paketdan 1 dars sarflanadi (`lessonsDone++`).
- ✅ **Tezkor darsga kelmaganlik xabari (`STUDENT_ABSENT`)**: O‘quvchi kelmagan zahoti uning ota-onasiga Telegram xabar borishi.
- ✅ **Ikki tomonlama to‘lov eslatmasi**: To‘lov eslatmalari bir vaqtda ham farzandga, ham ota-onaga yuborilishi.
- ✅ Haftalik jadval asosida 90 kunlik darslar generatsiyasi (`generateLessons`).
- ✅ 2 ta bepul sinov darsi (`PRESENT`) va 12 darslik to‘lov hisoblagichi.
- ✅ Davomat mexanizmi (Telegram inline orqali va veb-panel zaxira tahrirchisi).
- ✅ To‘lovlarni qabul qilish (CASH, CARD, BANK) va kvitansiyalar.
- ✅ Avtomatik buxgalteriya: To‘lov kiritilganda `Transaction(INCOME, "tuition")` yaratilishi.
- ✅ Chiqimlar kiritish (ijara, maosh, kommunal va h.k.).
- ✅ Ketma-ket 5 marta dars qoldirgan o‘quvchini avtomatik `SUSPENDED` qilish.
- ✅ Barcha cron vazifalari (davomat so‘rovi, dars eslatmasi, 09:00 qarzdorlik eslatmasi).
- ✅ Ko‘p farzandli ota-onalar uchun yagona birlashtirilgan to‘lov eslatmasi.
- ✅ Audit log tizimi va xavfsiz soft-delete (`deletedAt`).

### 1.2. Telegram Bot (`bot`) — Faqat O‘zbek Tilida
- ✅ Webhook rejimida grammY arxitekturasi.
- ✅ **Faqat O‘zbek tilida** (barcha xabarlar va menyular sof o‘zbek tilida, `/til` komandasi mavjud emas).
- ✅ Telefon raqam (kontakt) orqali avtomatik identifikatsiya (`/start`, `POST /internal/auth/link-telegram`).
- ✅ O‘quvchi komandalari: `/balans`, `/darslar`.
- ✅ Ota-ona komandasi: `/farzandlarim`, `/balans`, `/darslar`.
- ✅ O‘qituvchi komandalari: `/guruhlarim`, `/davomat`.
- ✅ Dars boshlanganda avtomatik: **"🔔 Dars vaqti bo‘ldi!"** va **"[📋 Yo‘qlamani boshlash]"** tugmasi.

### 1.3. Veb Mijoz va PWA (`client`)
- ✅ Next.js App Router va Tailwind CSS (CDN orqali, inline konfiguratsiya).
- ✅ Radix UI Primitives asosidagi komponentlar.
- ✅ Admin boshqaruv paneli (Dashboard, O‘quvchilar, Ota-onalar, Guruhlar, Darslar, To‘lovlar, Chiqimlar, Hisobotlar, Audit).
- ✅ **O‘qituvchi veb boshqaruv paneli**: Guruhlar ro‘yxati, guruh ichida o‘quvchilar ro‘yxati, o‘quvchi bosilganda uning ma'lumotlari va barcha darslar bo‘yicha to‘liq davomat tarixi.
- ✅ PWA imkoniyatlari (manifest, service worker, oflayn ko‘rish, o‘rnatish taklifi).

---

## 2. Qabul Qilingan Standart Qarorlar (Defaults Matrix)

| Kod | Savol / Mavzu | Qabul Qilingan Standart Qiymat |
|---|---|---|
| **B1** | Grace Period | **7 kun** (Oldindan to‘lov muddati to‘liq darslar boshlanguncha yoki 7 kun ichida). |
| **B2** | Bepul sinov darslari soni | **2 ta `PRESENT` dars**. Kelmagan darslar sinov hisobiga kirmaydi. |
| **B3** | To‘lov sikli davomiyligi | **12 ta dars** (kurs yoki guruh uchun standart paket). |
| **B4** | To‘lov modeli | **Prepay (Oldindan to‘lov)**: Har bir 12 darslik sikl darslar boshlanishidan oldin to‘lanadi. |
| **B5** | Dars qoldirish limiti | **5 ta ketma-ket `ABSENT`** dars. O‘quvchi holati avtomatik `SUSPENDED` bo‘ladi. |
| **B6** | Ko‘p farzandli ota-onalar | **Birlashtirilgan yagona xabar** orqali barcha farzandlar qarzi bitta jadvalda yetkaziladi. |
| **B7** | Kunlik eslatma vaqti | **Har kuni ertalab 09:00** (Toshkent vaqti bilan). |
| **B8** | Qat'iy ogohlantirish | Qarzdorlik muddati o‘tganiga **3 kundan oshgach** "Oxirgi ogohlantirish" shakli yuboriladi. |
| **B9** | Ma'lumotlarni o‘chirish | **Soft-delete** (`deletedAt`) — User, Student, Parent, Group jadvallari uchun. |
| **B10**| O‘chirilmaslik qoidasi | **Immutability** — Payment, PaymentCycle, Attendance, Transaction, AuditLog o‘chirilmaydi. |
| **B11**| Kurs narxining o‘zgarishi | Faqat **kelajakda ochiladigan yangi sikllarga** ta'sir qiladi. |
| **B12**| O‘qituvchi maoshi (MVP) | Hozircha **`Transaction(EXPENSE, "salary")`** orqali qo‘lda kiritiladi. |
| **B13**| O‘quvchi-Ota-ona bog‘liqligi | Har bir farzand uchun **faqat bitta mas'ul ota yoki ona** biriktiriladi (`Student.parentId`). |
| **B14**| Darsga kelmaganlik xabari | O‘quvchiga `ABSENT` qo‘yilganda uning ota-onasiga **zudlik bilan (real-time)** Telegram xabar boradi. |
| **B15**| Ikki tomonlama to‘lov eslatmasi| To‘lov ogohlantirishlari **farzandga ham, uning ota-onasiga ham** parallel ravishda yuboriladi. |
| **B16**| Davomatda dars hisobi | **Kelsa ham, kelmasa ham dars o‘tildi deb hisoblanadi** (`lessonsDone++`). |
| **B17**| Bot tili | **Faqat O‘zbek tilida** (barcha bot komandalari va xabarlari faqat o‘zbek tilida). |
| **C1** | PWA Oflayn imkoniyati | **Faqat ko‘rish (Read-only)** — oxirgi keshdagi ma'lumotlar ko‘rsatiladi. |
| **C2** | PWA O‘rnatish taklifi | **2-tashrifda avtomatik**, shuningdek paneldagi o‘rnatish tugmasi orqali. |
| **C3** | Tailwind uslubi | MVP bosqichida **CDN**, keyingi versiyalarda build-based Tailwind va shadcn/ui ga o‘tiladi. |
