# 09. Xavfsizlik, Rollar va Ruxsatlar (Security & Permissions)

Ushbu hujjatda **Edu Center** axborot tizimining xavfsizlik arxitekturasi, foydalanuvchi rollari, qator darajasidagi ma'lumotlar filtri (Row-Level Security), autentifikatsiya protokollari va tizim himoyasi bayon etilgan.

---

## 1. Rollar va Huquqlar Matritsasi (RBAC)

Tizimda 4 xil foydalanuvchi turi mavjud bo‘lib, ularning huquqlari va kirish nuqtalari quyidagicha taqsimlangan:

| Resurs / Amal | ADMIN | TEACHER | STUDENT | PARENT |
|---|:---:|:---:|:---:|:---:|
| **Kirish joyi** | Veb panel + PWA | Veb panel + PWA + Bot | Faqat Telegram Bot | Faqat Telegram Bot |
| **Xodimlarni boshqarish (Users CRUD)** | ✅ To‘liq | ❌ Yo‘q | ❌ Yo‘q | ❌ Yo‘q |
| **Kurslar va Guruhlar** | ✅ Barchasi | 🟡 Faqat o‘ziniki | ❌ Yo‘q | ❌ Yo‘q |
| **Dars jadvali va kalendar** | ✅ Barchasi | 🟡 Faqat o‘ziniki | 🟡 Faqat o‘ziniki (bot) | 🟡 Farzandlariniki (bot) |
| **Davomat belgilash** | ✅ Veb (barchasi) | 🟡 Bot + Veb (o‘ziniki) | ❌ Yo‘q | ❌ Yo‘q |
| **To‘lov qabul qilish (Oldindan to‘lov)** | ✅ To‘liq | ❌ Yo‘q | ❌ Yo‘q | ❌ Yo‘q |
| **Chiqimlarni kiritish (Buxgalteriya)** | ✅ To‘liq | ❌ Yo‘q | ❌ Yo‘q | ❌ Yo‘q |
| **Markaz umumiy foydasi va hisobotlar** | ✅ To‘liq | ❌ Yo‘q | ❌ Yo‘q | ❌ Yo‘q |
| **Shaxsiy tushum hisoboti** | ✅ To‘liq | 🟡 O‘z guruhlariniki | ❌ Yo‘q | ❌ Yo‘q |
| **Audit jurnali (AuditLog)** | ✅ To‘liq | ❌ Yo‘q | ❌ Yo‘q | ❌ Yo‘q |

---

## 2. O‘quvchi va Ota-ona Munosabatlari Xavfsizligi

1. **Yagona mas'ul ota-ona printsipi**:
   - Har bir o‘quvchi uchun tizimda **faqat bitta mas'ul ota yoki ona** hisobi biriktiriladi (`Student.parentId`).
   - Bu orqali dars qoldirilganda (`STUDENT_ABSENT`) va to‘lov eslatmalarida ma'lumotlar faqat vakolatli yagona ota-onaga yetkazilishi kafolatlanadi.
2. **Ota-ona ma'lumotlariga ruxsat**:
   - Ota-ona Telegram bot orqali faqat o‘ziga biriktirilgan farzandlarining dars jadvali, davomati va to‘lov holatlarini ko‘ra oladi. Boshqa o‘quvchilar ma'lumotlariga kirish to‘liq taqiqlangan.

---

## 3. Qator Darajasidagi Xavfsizlik (Row-Level Security)

O‘qituvchi (`TEACHER`) tizimga kirganida, u boshqa o‘qituvchilarning darslari, kurslari, guruhlari yoki moliyaviy ma'lumotlarini aslo ko‘ra olmaydi. Bu server darajasidagi `TeacherOwnershipGuard` va Prisma so‘rovlarida qat'iy tekshiriladi:

```typescript
// NestJS Service namunasi:
async getTeacherGroups(userId: string, role: Role) {
  if (role === Role.ADMIN) {
    return this.prisma.group.findMany({ where: { deletedAt: null } });
  }

  // O'qituvchi bo'lsa, qat'iy ravishda faqat o'ziga tegishlilari qaytariladi
  return this.prisma.group.findMany({
    where: {
      teacherId: userId,
      deletedAt: null
    }
  });
}
```

---

## 4. Autentifikatsiya va Sessiyalar Xavfsizligi

### 4.1. Parollar va Xeshlash
- Barcha parollar `bcrypt` algoritmi orqali kamida 10-12 salt rounds bilan xeshlanadi.

### 4.2. JWT Tokenlar Strategiyasi
- **Access Token**: Yaroqlilik muddati — **15 daqiqa**.
- **Refresh Token**: Yaroqlilik muddati — **7 kun** (`httpOnly`, `Secure`, `SameSite=Strict` cookie). Token rotatsiyasi qo‘llaniladi.

---

## 5. API va Tarmoq Xavfsizligi

- **Ichki API kaliti (`INTERNAL_API_KEY`)**: Bot va server o‘rtasidagi so‘rovlar uchun.
- **Webhook maxfiy kaliti (`WEBHOOK_SECRET_TOKEN`)**: Telegram webhook so‘rovlarini tekshirish uchun.
- **Rate Limiting**: Brute-force hujumlaridan himoya qilish uchun login endpointlarida daqiqasiga ko‘pi bilan 5 ta urinish chegarasi.
- **AuditLog**: Barcha to‘lovlar, davomat o‘zgarishlari va a'zolik o‘zgarishlari tizim audit jurnalida saqlanadi.
