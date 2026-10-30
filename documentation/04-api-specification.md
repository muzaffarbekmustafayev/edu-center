# 04. REST API va Ichki API Spetsifikatsiyasi (API Specification)

Ushbu hujjatda **Edu Center** serveri (`server` — NestJS) tomonidan taqdim etiladigan barcha ochiq, himoyalangan va ichki API endpointlari, so‘rov/javob formatlari va biznes qoidalari keltirilgan.

---

## 1. Umumiy Standartlar

- **Asosiy URL prefiksi**: `/api/v1`
- **Kontent turi**: `application/json; charset=utf-8`
- **Sana formati**: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Vaqt mintaqasi javoblari**: `Asia/Tashkent`
- **Hujjatlashtirish**: Swagger UI orqali `/api/docs`, OpenAPI JSON spetsifikatsiyasi esa `/api-json`.

---

## 2. Autentifikatsiya va Sessiya (Auth Endpoints)

Veb-panelga kirish faqat xodimlar (`User`: `ADMIN`, `TEACHER`) uchun mo‘ljallangan.

### 2.1. Tizimga kirish
- `POST /api/v1/auth/login` (Body: `{ phone, password }`) → `{ accessToken, refreshToken, user }`
- `POST /api/v1/auth/refresh` (Body: `{ refreshToken }`) → `{ accessToken }`
- `GET /api/v1/auth/me` → joriy profil ma'lumotlari.

---

## 3. O‘qituvchi Veb Paneli Endpointlari (Teacher Web Panel)

O‘qituvchi veb dashboardida faqat o‘ziga tegishli ma'lumotlarni ko‘radi:

### 3.1. O‘qituvchining guruhlari
- `GET /api/v1/teacher/groups`
  - Response: Guruhlar ro‘yxati (nomi, fani, o‘quvchilar soni, dars jadvali, bugun dars borligi).

### 3.2. Guruh tafsilotlari va o‘quvchilar ro‘yxati
- `GET /api/v1/teacher/groups/:id`
  - Response: Guruh ma'lumotlari va unga a'zo bo‘lgan barcha o‘quvchilar ro‘yxati (ismi, telefon raqami, joriy to‘lov siklidagi o‘tilgan darslari soni `lessonsDone/12`, a'zolik holati `ACTIVE` yoki `SUSPENDED`).

### 3.3. O‘quvchi ma'lumotlari va to‘liq davomat tarixi
- `GET /api/v1/teacher/groups/:groupId/students/:studentId`
  - Response:
    - O‘quvchi ismi, telefoni.
    - Mas'ul ota yoki onasining ismi va telefoni.
    - Guruhdagi barcha o‘tilgan darslar bo‘yicha to‘liq davomat ro‘yxati: sana, vaqt, holat (`PRESENT`, `ABSENT`, `EXCUSED`).

---

## 4. O‘quvchilar va Mas'ul Ota-onalar (Admin)

- `POST /api/v1/students` — Yangi o‘quvchi yaratish va bitta mas'ul ota-onani biriktirish (`parentId`, `parentRelation`).
- `PATCH /api/v1/students/:id` — O‘quvchi ma'lumotlarini yoki uning mas'ul ota-onasini tahrirlash.
- `GET /api/v1/parents` va `POST /api/v1/parents` — Ota-onalar bazasi.

---

## 5. Darslar va Davomat (Lessons & Attendance)

- `GET /api/v1/lessons` — Kalendar ko‘rinishi.
- `POST /api/v1/lessons/:id/cancel` — Darsni bekor qilish.
- `POST /api/v1/lessons/:id/attendance` — Davomatni belgilash (Veb fallback).
  - *Mantiq*: `PRESENT` va `ABSENT` har ikkisi ham `lessonsDone++` ni oshiradi. `ABSENT` bo‘lgan o‘quvchining ota-onasiga darhol `STUDENT_ABSENT` bildirishnomasi uzatiladi.

---

## 6. To‘lovlar — Oldindan To‘lov (Prepay)

- `GET /api/v1/payments/debtors` — To‘lov muddati kelgan yoki kechikkan (`PENDING`, `OVERDUE`) sikllar ro‘yxati.
- `POST /api/v1/payments` — Oldindan to‘lovni qabul qilish:
```json
{
  "cycleId": "cuid_cycle_12",
  "amount": 450000,
  "method": "CARD",
  "note": "12 ta dars uchun oldindan to'lov"
}
```
*Natijada*: Sikl `PAID` bo‘ladi, `Transaction(INCOME, "tuition")` yoziladi, farzand va ota-onaga kvitansiya jo‘natiladi.

---

## 7. Ichki API (Internal API — Bot va Server Aloqasi)

Barcha endpointlar `X-Internal-Key: <INTERNAL_API_KEY>` orqali himoyalanadi.

### 7.1. Telegram Akkauntni Bog‘lash (`/start`)
- **Metod / Manzil**: `POST /api/v1/internal/auth/link-telegram`
- **Request Body**:
```json
{
  "telegramId": "123456789",
  "phone": "+998901234567"
}
```
- **Response 200 OK**:
```json
{
  "id": "cuid_student_1",
  "name": "Jasur Aliyev",
  "role": "STUDENT"
}
```
- **Xatolar**:
  - `404 Not Found`: "Telefon raqam tizimda topilmadi".
  - `409 Conflict`: "Bu telefon boshqa Telegramga bog‘langan".

### 7.2. Telegram ID Bo‘yicha Tekshirish
- **Metod / Manzil**: `GET /api/v1/internal/auth/by-telegram/:telegramId`
- **Response 200 OK**: `{ "id": "...", "name": "...", "role": "TEACHER" }`

### 7.3. Balans Ma'lumotlari (`/balans`)
- **Metod / Manzil**: `GET /api/v1/internal/bot/students/balance/:telegramId`
- **Response 200 OK**:
  - Agar Student bo‘lsa: joriy sikllar, o‘tilgan darslar / 12, to‘lov holati, qarz summasi va oxirgi 3 ta to‘lov.
  - Agar Parent bo‘lsa: biriktirilgan barcha farzandlari bo‘yicha sikllar va umumiy qarz.

### 7.4. Darslar Jadvali (`/darslar`)
- **Metod / Manzil**: `GET /api/v1/internal/bot/students/lessons/:telegramId`
- **Response 200 OK**: Bugungi darslar, keyingi 7 kunlik darslar va oxirgi 3 ta o‘tgan dars davomat holati.

### 7.5. O‘qituvchining Guruhlari (`/guruhlarim`)
- **Metod / Manzil**: `GET /api/v1/internal/bot/teachers/groups/:telegramId`
- **Response 200 OK**: Guruhlar ro‘yxati, jadval va bugungi darslar belgisi.
- **Guruh tafsilotlari**: `GET /api/v1/internal/bot/teachers/groups/:telegramId/:groupId`

### 7.6. Dars Boshlanganda Yo‘qlamani Yakunlash
- **Metod / Manzil**: `POST /api/v1/internal/bot/attendance/finalize`
- **Request Body**:
```json
{
  "lessonId": "cuid_lesson_1",
  "attendances": [
    { "studentId": "cuid_st_1", "status": "PRESENT" },
    { "studentId": "cuid_st_2", "status": "ABSENT" }
  ]
}
```
- **Natija**: Davomat saqlanadi, har bir `ABSENT` o‘quvchining ota-onasiga zudlik bilan `STUDENT_ABSENT` bildirishnomasi jo‘natiladi, barcha qatnashgan/kelmagan o‘quvchilar uchun dars o‘tildi deb hisoblanadi (`lessonsDone++`).
