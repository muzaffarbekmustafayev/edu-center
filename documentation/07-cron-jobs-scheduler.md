# 07. Cron Vazifalar va Rejalashtiruvchi (Cron Jobs & Scheduler)

Ushbu hujjatda **Edu Center** serverida (`server` — NestJS) orqa fonda ishlovchi avtomatik vazifalar (`@nestjs/schedule`), ularning bajarilish jadvallari, biznes vazifalari va yangilangan qoidalar (oldindan to‘lov eslatmasi, ikki tomonlama bildirishnomalar) keltirilgan.

---

## 1. Umumiy Konfiguratsiya

- **Kutubxona**: `@nestjs/schedule` (NestJS Cron moduli).
- **Vaqt Mintaqasi**: Barcha cron jadvallari O‘zbekiston vaqti (`Asia/Tashkent`, UTC+5) bilan ishlaydi.
- **Hodisaviy (Event-Driven) va Rejali (Cron) Xabarnomalar**:
  - **Darhol yuboriladigan xabarlar**: O‘quvchi darsga kelmaganida (`STUDENT_ABSENT`) cron kutib o‘tirilmaydi — davomat saqlangan soniyadayoq ota-onaga yuboriladi.
  - **Rejali xabarlar**: 90 kunlik dars generatsiyasi, 15 min oldingi dars eslatmasi, 09:00 dagi oldindan to‘lov eslatmalari cron orqali rejalashtiriladi.

---

## 2. Cron Vazifalar Reestri

| Nomi | Jadval | Vaqt (Toshkent) | Vazifasi va Maqsadi |
|---|---|---|---|
| **`generateLessons`** | `0 3 * * *` | Har kuni soat 03:00 da | Faol guruhlar uchun kelgusi 90 kunlik darslarni oldindan generatsiya qilish. |
| **`lessonAttendanceRequest`** | `* * * * *` | Har daqiqada | Dars boshlanishiga 5 daqiqa qolganda o‘qituvchiga inline davomat xabarini yuborish. |
| **`lessonStudentReminder`** | `* * * * *` | Har daqiqada | Dars boshlanishiga 15 daqiqa qolganda farzand va uning ota-onasiga dars eslatmasini yuborish. |
| **`paymentOverdueMark`** | `5 0 * * *` | Har kuni soat 00:05 da | Oldindan to‘lov muddati o‘tgan to‘lov sikllarini `OVERDUE` ga o‘tkazish. |
| **`paymentDueCheck`** | `0 9 * * *` | Har kuni soat 09:00 da | Oldindan to‘lov muddati kelgan (`PENDING`, `OVERDUE`) sikllar bo‘yicha **farzandga ham, ota-onasiga ham** eslatma yuborish. |
| **`retryFailedNotifications`**| `*/15 * * * *` | Har 15 daqiqada | Tarmoq xatolari sababli yetkazilmagan xabarlarni qayta yuborish. |

---

## 3. Har Bir Vazifaning Ishlash Logikasi

### 3.1. `generateLessons` — 90 Kunlik Darslar Generatsiyasi
- **Trigger**: Har kuni soat 03:00 da.
- **Algoritm**: Barcha faol guruhlar tekshirilib, ularning haftalik jadvali bo‘yicha keyingi 90 kunlik muddat uchun darslar to‘liq bo‘lishi ta'minlanadi.

---

### 3.2. `lessonAttendanceRequest` — O‘qituvchiga Davomat So‘rovi
- **Trigger**: Har daqiqada bir marta.
- **Tanlash sharti**: Dars boshlanishiga 5 daqiqa qolgan darslar (`scheduledAt - 5 daqiqa`).
- **Natija**: O‘qituvchiga inline keyboard yuboriladi. O‘qituvchi davomatni saqlagan paytda `ABSENT` bo‘lgan o‘quvchilarning ota-onalariga zudlik bilan `STUDENT_ABSENT` bildirishnomasi uzatiladi.

---

### 3.3. `lessonStudentReminder` — Dars Eslatmasi (15 daqiqa oldin)
- **Trigger**: Har daqiqada bir marta.
- **Qabul qiluvchilar**: Farzand va uning mas'ul ota-onasi.
- **Natija**: Har ikkala tomonga dars boshlanishi, xona va o‘qituvchi ma'lumoti yuboriladi.

---

### 3.4. `paymentDueCheck` — Oldindan To‘lov Eslatmalari (09:00)
- **Trigger**: Har kuni soat 09:00 da.
- **Shart**: `PaymentCycle.status IN ['PENDING', 'OVERDUE']`.
- **Muhim mantiq**:
  1. Eslatma bir vaqtning o‘zida **ham o‘quvchining o‘ziga, ham uning bitta mas'ul ota-onasiga** yuboriladi.
  2. Bitta ota-onaning bir nechta farzandi bo‘lsa, barcha farzandlar bo‘yicha qarz bitta birlashtirilgan jadvalda yetkaziladi.
  3. Agar to‘lov muddati o‘tganiga 3 kundan oshgan bo‘lsa, xabar matni "Qat'iy ogohlantirish" shakliga o‘tadi.
