# 08. Bildirishnomalar Shablonlari (Notifications)

Ushbu hujjatda **Edu Center** tizimida generatsiya qilinadigan barcha avtomatik Telegram xabarnomalari, ularning turlari (`NotificationType`) va **faqat O‘zbek tilidagi** aniq shablonlari keltirilgan.

> **Eslatma**: Telegram bot va barcha bildirishnomalar **faqat O‘zbek tilida** yuboriladi.

---

## 1. Bildirishnoma Turlari va Qabul Qiluvchilar Reestri

| Turi | Qabul Qiluvchi | Yuborilish Sababi va Vaqti |
|---|---|---|
| **`STUDENT_ABSENT`** | **Faqat Ota-ona** | O‘quvchi darsga kelmaganida (`ABSENT`) **shu zahotiyoq** |
| **`PAYMENT_DUE`** | **Farzand va Ota-ona** | Sikl tugashiga 1-2 dars qolganda (Oldindan to‘lov eslatmasi) |
| **`PAYMENT_OVERDUE`**| **Farzand va Ota-ona** | Oldindan to‘lov muddati o‘tib ketganda (Har kuni 09:00 da) |
| **`PAYMENT_RECEIVED`**| **Farzand va Ota-ona** | Admin to‘lovni qabul qilib bazaga kiritganda (Kvitansiya) |
| **`LESSON_REMINDER`** | **Farzand va Ota-ona** | Dars boshlanishiga 15 daqiqa qolganda |
| **`ATTENDANCE_REQUEST`**| **O‘qituvchi** | Dars boshlanish vaqti kelganda ("Yo‘qlamani boshlash" tugmasi) |
| **`DROPPED_FROM_GROUP`**| **Farzand va Ota-ona** | Ketma-ket 5 marta dars qoldirib, faoliyati to‘xtatilganda |
| **`LESSON_CANCELLED`**| **Farzand va Ota-ona** | O‘qituvchi yoki admin darsni bekor qilganda |

---

## 2. Xabarnomalar Shablonlari (Faqat O‘zbek Tilida)

### 2.1. Darsga Kelmaganlik Xabari (`STUDENT_ABSENT` — Zudlik bilan Ota-onaga)

O‘qituvchi yo‘qlamani saqlaganda, agar o‘quvchiga `ABSENT` (Kelmadi) qo‘yilgan bo‘lsa, ushbu xabar ota-onaning Telegramiga darhol yetkaziladi:

```text
⚠️ Diqqat: Farzandingiz darsga kelmadi!

Hurmatli {parentName},
Farzandingiz {studentName} bugun soat {startTime} da bo‘lib o‘tgan "{courseName}" fanidan darsga kelmadi.

Iltimos, holat yuzasidan xabardor bo‘ling yoki markaz ma'muriyati bilan bog‘laning.
📞 Markaz telefoni: {adminPhone}
```

---

### 2.2. Oldindan To‘lov So‘rovi (`PAYMENT_DUE` — Prepayment)

Joriy 12 darslik to‘lov sikli tugashiga 1-2 dars qolganda (10 yoki 11-darsda), keyingi 12 darslik paket uchun oldindan to‘lov eslatmasi **farzandga ham, ota-onasiga ham** yuboriladi:

#### A. Farzand uchun (O‘quvchiga):
```text
💳 Oldindan to‘lov eslatmasi

Hurmatli {name}, sizning "{courseName}" kursi bo‘yicha joriy to‘lov siklingiz yakunlanmoqda ({lessonsDone}/12 dars o‘tildi).
Darslar uzluksiz davom etishi uchun keyingi 12 darslik to‘lovni oldindan amalga oshirishingizni so‘raymiz.
💰 To‘lov summasi: {amount} so‘m
📅 To‘lov muddati: {dueDate} gacha
```

#### B. Mas'ul Ota-ona uchun:
```text
💳 Farzandingiz uchun oldindan to‘lov eslatmasi

Hurmatli {parentName},
Farzandingiz {studentName} ning "{courseName}" kursi bo‘yicha to‘lov sikli yakunlanmoqda ({lessonsDone}/12 dars).
Keyingi 12 ta dars uchun oldindan to‘lovni amalga oshirishingizni so‘raymiz:
💰 Summa: {amount} so‘m
📅 Muddat: {dueDate} gacha
```

---

### 2.3. Kechiktirilgan To‘lov Eslatmasi (`PAYMENT_OVERDUE`)

Agar darslar boshlangan bo‘lsa-da, oldindan to‘lov amalga oshirilmagan bo‘lsa, har kuni 09:00 da farzandga ham, ota-onasiga ham boradi:

#### A. Standart eslatma (1–3 kun kechikishda):
```text
⚠️ To‘lov eslatmasi (Kechikmoqda)

Hurmatli {name}, "{courseName}" kursi bo‘yicha {amount} so‘m to‘lov muddati {daysOverdue} kundan buyon kechikmoqda.
Iltimos, bugun to‘lovni amalga oshiring yoki ma'muriyatga murojaat qiling.
📞 Telefon: {adminPhone}
```

#### B. Qat'iy ogohlantirish (3 kundan ortiq kechikishda):
```text
🚨 OXIRGI OGOHLANTIRISH: To‘lov amalga oshirilmadi!

Hurmatli {name}, "{courseName}" kursi bo‘yicha to‘lov {daysOverdue} kundan buyon kechikmoqda ({amount} so‘m).
Agar to‘lov yaqin vaqt ichida amalga oshirilmasa, o‘quvchi mashg‘ulotlardan chetlashtirilishi mumkin.
📞 Aloqa uchun: {adminPhone}
```

---

### 2.4. To‘lov Qabul Qilindi (`PAYMENT_RECEIVED` — Elektron Kvitansiya)

To‘lov kiritilganda **farzandga ham, uning mas'ul ota-onasiga ham** parallel ravishda kvitansiya yuboriladi:

```text
✅ To‘lov qabul qilindi!

Hurmatli {name}, to‘lovingiz muvaffaqiyatli qabul qilindi:
📄 Kvitansiya №: {receiptId}
👤 O‘quvchi: {studentName}
📖 Kurs: {courseName}
💰 Summa: {amount} so‘m
💳 Usul: {paymentMethod}
📅 Sana: {paidDate}

Edu Center ni tanlaganingiz uchun tashakkur!
```

---

### 2.5. Dars Boshlanganda O‘qituvchiga Xabar (`ATTENDANCE_REQUEST`)

Guruh darsi boshlangan vaqtda o‘qituvchining Telegramiga inline tugma bilan boradi:

```text
🔔 Dars vaqti bo‘ldi!

📚 Guruh: {groupName}
📖 Kurs: {courseName}
📍 Xona: {room} ({durationMin} daqiqa)

Iltimos, yo‘qlamani o‘tkazing:
[📋 Yo‘qlamani boshlash]
```

---

### 2.6. Dars Eslatmasi (`LESSON_REMINDER` — 15 daqiqa oldin)

```text
🔔 Dars eslatmasi!

Hurmatli {name}, bugun soat {startTime} da "{courseName}" fanidan dars boshlanadi.
📍 Xona: {room}
👨‍🏫 O‘qituvchi: {teacherName}

Kechikmasdan kelishingizni so‘raymiz!
```

---

### 2.7. Ketma-ket 5 Dars Kelmaganlik (`DROPPED_FROM_GROUP`)

```text
🚫 Guruhdan chetlashtirish to‘g‘risida xabarnoma

Hurmatli {name}, o‘quvchi ketma-ket 5 ta darsda qatnashmaganligi sababli "{groupName}" guruhidagi faoliyati vaqtincha to‘xtatildi (SUSPENDED).
Guruhdagi o‘rnini qayta tiklash uchun o‘quv markaz ma'muriyatiga murojaat qiling.
📞 Telefon: {adminPhone}
```

---

### 2.8. Dars Bekor Qilindi (`LESSON_CANCELLED`)

```text
⚠️ Dars bekor qilindi

Hurmatli {name}, bugun soat {startTime} dagi "{courseName}" fanidan dars qoldirildi.
📝 Sabab: {cancelReason}

Ushbu dars bekor qilingani sababli darslar hisobingizdan yechilmaydi.
```

---

## 3. Ko‘p Farzandli Ota-onalar Uchun Birlashtirilgan Xabar

Bitta ota-onaga bir nechta farzand bo‘yicha to‘lov eslatmasi bitta umumiy xabarda yetkaziladi:

```text
Hurmatli {parentName},

Farzandlaringiz bo‘yicha oldindan to‘lov eslatmasi:

1. Ali Valiyev — Ingliz tili (IELTS 1) — 400 000 so‘m (muddat: 05.11.2026)
2. Zarina Valiyeva — Matematika (Pre-algebra) — 350 000 so‘m (muddat: 07.11.2026)

Jami to‘lov: 750 000 so‘m
Iltimos, darslar to‘xtab qolmasligi uchun to‘lovni oldindan amalga oshirishingizni so‘raymiz.
📞 Aloqa: {adminPhone}
```
