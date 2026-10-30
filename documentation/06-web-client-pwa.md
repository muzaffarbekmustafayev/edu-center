# 06. Veb Mijoz va PWA Spetsifikatsiyasi (Web Client & PWA)

Ushbu hujjatda **Edu Center** tizimining boshqaruv paneli (`client` — Next.js App Router), uning UI/UX arxitekturasi, Tailwind CSS CDN sozlamalari, Radix UI komponentlari, Admin va O‘qituvchi sahifalari hamda to‘liq PWA (Progressive Web App) talablari bayon etilgan.

---

## 1. Texnologik Stek va Arxitektura

- **Freymvork**: Next.js 14+ (App Router, TypeScript).
- **Styling (MVP bosqichida)**: **Tailwind CSS via CDN**.
  - `app/layout.tsx` ichida `<Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />` orqali ulanadi.
  - Inline konfiguratsiya orqali ranglar palitrasi va `darkMode: 'class'` sozlanadi.
- **UI Komponentlar**: **Radix UI Primitives** (headless — Dialog, DropdownMenu, Tabs, Toast, Popover, Select) + maxsus Tailwind klasslari.
- **Ikonkalar**: `lucide-react`.
- **Server holati (Data Fetching)**: `@tanstack/react-query` (TanStack Query) — kesh, optimistik yangilashlar va avtomatik refetch.
- **Form va Validatsiya**: `react-hook-form` va `zod`.
- **Autentifikatsiya**: JWT (access token xotirada, refresh token xavfsiz `httpOnly` cookie ichida).
- **Veb panel foydalanuvchilari**: **Faqat Admin va O‘qituvchilar**. O‘quvchi va ota-onalar faqat Telegram botdan foydalanadi.

---

## 2. Tailwind CDN Sozlamasi (`app/layout.tsx`)

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <head>
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="beforeInteractive"
        />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    primary: {
                      50: '#eff6ff',
                      100: '#dbeafe',
                      500: '#3b82f6',
                      600: '#2563eb',
                      700: '#1d4ed8',
                      800: '#1e40af'
                    }
                  }
                }
              }
            }
          `}
        </Script>
      </head>
      <body className="h-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## 3. Sahifalar Tuzilmasi va Imkoniyatlar

### 3.1. Admin Paneli Sahifalari (`/admin/*`)

| Sahifa | Yo‘nalish | Imkoniyatlar va Yangilangan Qoidalar |
|---|---|---|
| **Dashboard** | `/admin/dashboard` | Jami o‘quvchilar, faol guruhlar, oylik kirim, chiqim, sof foyda, oldindan to‘lov muddati kelganlar soni, bugungi darslar. |
| **Xodimlar** | `/admin/users` | Admin va o‘qituvchilarni yaratish, tahrirlash (**O‘qituvchi uchun Telegram ID kiritiladi** — bot avtomatik tanishi uchun), soft-delete. |
| **O‘quvchilar** | `/admin/students` | O‘quvchilar ro‘yxati, qidiruv, guruhga biriktirish, **bitta mas'ul ota yoki onani biriktirish**, to‘lov sikllari va dars balansi. |
| **Ota-onalar** | `/admin/parents` | Ota-onalar bazasi, biriktirilgan farzandlari ro‘yxati, telefon raqami va Telegram holati. |
| **Kurslar** | `/admin/courses` | Kurslar CRUD (nomi, narxi, 12 darslik paket, mas'ul o‘qituvchi). |
| **Guruhlar** | `/admin/groups` | Guruhlar CRUD, dars jadvali, **dars davomiyligi (`durationMin`)**, xona, o‘qituvchi, o‘quvchilar ro‘yxati va 90 kunlik darslar. |
| **Darslar** | `/admin/lessons` | Kalendar ko‘rinishi (kun/hafta/oy), darsni bekor qilish (sabab yozish bilan) yoki ko‘chirish. |
| **Davomat** | `/admin/attendance` | Guruh va sana bo‘yicha davomatni belgilash/tuzatish. Kelmagan o‘quvchilar ota-onasiga xabar yuborilganlik holati. |
| **To‘lovlar** | `/admin/payments` | **Oldindan to‘lovlarni qabul qilish** modali (CASH, CARD, BANK), kvitansiyalar arxivi, to‘lov kutilayotganlar ro‘yxati. |
| **Buxgalteriya** | `/admin/transactions` | Kirim va chiqimlar ro‘yxati, xarajat kiritish (ijara, maosh, kommunal va h.k.). |
| **Hisobotlar** | `/admin/reports` | Oylik moliyaviy oqim, guruhlar rentabelligi, Excel (.xlsx) va PDF eksport. |
| **Xabarnomalar** | `/admin/notifications` | Yuborilgan Telegram xabarlari (darsga kelmaganlik, oldindan to‘lov eslatmasi, cheklar) tarixi va FAILED monitoringi. |
| **Audit Log** | `/admin/audit-logs` | Kim qachon qaysi to‘lovni kiritgani, darsni bekor qilgani yoki davomatni o‘zgartirganini ko‘rsatuvchi xavfsizlik jurnali. |
| **Sozlamalar** | `/admin/settings` | Markaz ma'lumotlari, grace period (7 kun), dars qoldirish limiti (5 ta) va eslatma vaqtlari. |

---

### 3.2. O‘qituvchi Veb Dashboardi (`/teacher/*`)

O‘qituvchi faqat o‘ziga tegishli darslar, guruhlar va o‘quvchilarni ko‘radi:

1. **Mening guruhlarim (`/teacher/groups`)**:
   - Faqat o‘ziga biriktirilgan faol guruhlar kartalari.
   - Har bir kartada: guruh nomi, fan, dars jadvali, xona, o‘quvchilar soni va bugun dars bor-yo‘qligi ko‘rinadi.
2. **Guruh sahifasi va o‘quvchilar ro‘yxati (`/teacher/groups/:id`)**:
   - Guruh ichiga kirilganda unga biriktirilgan barcha o‘quvchilar ro‘yxati jadval ko‘rinishida chiqadi.
   - O‘quvchi ismi, telefoni, to‘lov holati va joriy sikldagi darslar soni (`8/12`).
3. **O‘quvchi profili va to‘liq davomat tarixi (`/teacher/groups/:id/students/:studentId`)**:
   - O‘quvchi ustiga bosilganda uning batafsil kartasi ochiladi:
     - Shaxsiy ma'lumotlari va telefoni.
     - Mas'ul ota-onasining ismi va telefoni.
     - **Barcha darslar bo‘yicha to‘liq davomat tarixi**: dars sanalari va holatlari (`✅ Keldi`, `❌ Kelmadi`, `⏸ Sababli`).
4. **Mening kurslarim (`/teacher/courses`)**: O‘z kurslari ro‘yxati, narxni o‘zgartirish (yangi sikllarga ta'sir qiladi).
5. **Mening tushumim (`/teacher/revenue`)**: O‘z guruhlari bo‘yicha qilingan oldindan to‘lovlar tushumi (boshqa o‘qituvchilar ko‘rinmaydi).

---

## 4. PWA (Progressive Web App) Spetsifikatsiyasi

### 4.1. Manifest Fayli (`public/manifest.json`)
- Ilova nomi: "Edu Center — O'quv Markaz Boshqaruvi"
- Display: `standalone`
- Ranglar: `theme_color: #2563eb`, `background_color: #ffffff`
- Ikonkalar: 192x192, 512x512, maskable 512x512.

### 4.2. Service Worker va Kesh Strategiyasi
- GET so‘rovlar (ma'lumotlarni ko‘rish): `NetworkFirst` (10s timeout, 24 soat kesh).
- Statik resurslar: `CacheFirst` (30 kun).
- **Yozuv amallari (To‘lov kiritish, davomat saqlash)**: Faqat onlayn rejimda ishlaydi, keshlanmaydi.

### 4.3. Oflayn Sahifa (`app/offline/page.tsx`)
Internet uzilganda "Internet aloqasi yo‘q. Oxirgi ko‘rilgan ma'lumotlar keshdan ko‘rsatilmoqda" xabari ko‘rsatiladi.

### 4.4. O‘rnatish Taklifi (`useInstallPrompt`)
2-tashrifda avtomatik o‘rnatish taklifi chiqadi, shuningdek boshqaruv paneli headerida "📱 Ilovani o‘rnatish" tugmasi mavjud bo‘ladi.
