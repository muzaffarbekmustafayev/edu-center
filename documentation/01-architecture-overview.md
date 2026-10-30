# 01. Tizim Arxitekturasi va Umumiy Ko‘rinish

Ushbu hujjatda **Edu Center** axborot tizimining umumiy arxitekturasi, tarkibiy qismlari, ular o‘rtasidagi aloqa protokollari va tizim integratsiyasi bayon etilgan.

---

## 1. Umumiy Arxitektura Diagrammasi

Tizim bitta Git repozitoriyasida joylashgan bo‘lib, 3 ta mustaqil modullardan (`client`, `server`, `bot`) va yagona PostgreSQL ma’lumotlar bazasidan tashkil topgan:

```mermaid
flowchart TD
    subgraph ClientLayer ["Mijoz Qatlami (client)"]
        WebAdmin["Next.js Web / PWA\n(Admin & Teacher Panel)"]
    end

    subgraph TelegramLayer ["Telegram Ekotizimi"]
        TeacherTG["O'qituvchilar (Telegram)"]
        StudentTG["O'quvchilar (Telegram)"]
        ParentTG["Mas'ul Ota-onalar (1:1 Telegram)"]
        TGServers["Telegram Bot API Serverlari"]
    end

    subgraph BotLayer ["Bot Qatlami (bot)"]
        BotService["grammY Webhook Bot\n(Node.js / TypeScript)"]
    end

    subgraph ServerLayer ["Server Qatlami (server)"]
        NestAPI["NestJS REST API\n(Controllers & Services)"]
        CronModule["@nestjs/schedule\n(Background Cron Jobs)"]
        PrismaORM["Prisma ORM"]
    end

    subgraph DataLayer ["Ma'lumotlar Qatlami"]
        PostgresDB[("PostgreSQL\n(Timezone: Asia/Tashkent)")]
    end

    WebAdmin -->|"HTTPS / REST API (JWT Bearer)"| NestAPI
    TeacherTG <-->|"Telegram App"| TGServers
    StudentTG <-->|"Telegram App"| TGServers
    ParentTG <-->|"Telegram App"| TGServers
    TGServers -->|"HTTPS Webhook (Secret Token)"| BotService
    BotService -->|"Internal REST API (INTERNAL_API_KEY)"| NestAPI
    NestAPI -->|"Prisma Client"| PostgresDB
    CronModule -->|"Triggers & Queries"| PrismaORM
    PrismaORM --> PostgresDB
    NestAPI -->|"Direct HTTPS (api.telegram.org)\nPush: Kelmaganlik, Eslatma, Chek"| TGServers
```

---

## 2. Asosiy Aloqa va Biznes Oqimlari

### 2.1. Davomat va Kelmaganlik Xabari Oqimi (Immediate Absence Alert)
```mermaid
sequenceDiagram
    autonumber
    participant Teacher as O'qituvchi (Telegram)
    participant TG as Telegram Bot API
    participant Bot as grammY Webhook
    participant Server as NestJS API
    participant DB as PostgreSQL
    participant Parent as Mas'ul Ota-ona (Telegram)

    Teacher->>TG: Davomatda o'quvchiga [❌ Yo'q] belgilaydi
    TG->>Bot: att:lessonId:studentId:ABSENT
    Bot->>Server: POST /internal/bot/attendance/draft
    Teacher->>TG: [💾 Barchasini saqlash] bosadi
    TG->>Bot: att:save:lessonId
    Bot->>Server: POST /internal/bot/attendance/finalize
    Server->>DB: Davomatni saqlaydi (consecutiveAbsences++)
    Server->>TG: O'quvchining mas'ul ota-onasiga zudlik bilan xabar yuboradi: STUDENT_ABSENT
    TG->>Parent: "⚠️ Hurmatli ota-ona, farzandingiz bugun darsga kelmadi"
```

### 2.2. Oldindan To‘lov (Prepay) Oqimi
```mermaid
sequenceDiagram
    autonumber
    participant Cron as Server (Cron)
    participant Server as NestJS API
    participant DB as PostgreSQL
    participant TG as Telegram Bot API
    participant Student as O'quvchi (Telegram)
    participant Parent as Ota-ona (Telegram)
    participant Admin as Admin (Web/PWA)

    Note over Cron,DB: 10 yoki 11-dars o'tilganda (yoki sikl boshlanishidan oldin)
    Server->>DB: Keyingi sikl ochiladi (cycleNo+1, status = PENDING)
    Server->>TG: Farzand va Ota-onaga baravar PAYMENT_DUE xabari
    TG->>Student: "Keyingi 12 dars uchun oldindan to'lov muddati keldi"
    TG->>Parent: "Farzandingizning keyingi 12 darsi uchun oldindan to'lov qiling"
    
    Admin->>Server: POST /api/v1/payments (to'lovni kiritadi)
    Server->>DB: Sikl status = PAID, Transaction(INCOME) yoziladi
    Server->>TG: Farzand va Ota-onaga PAYMENT_RECEIVED kvitansiyasi
    TG->>Student: "To'lovingiz qabul qilindi (Chek #...)"
    TG->>Parent: "Farzandingiz to'lovi qabul qilindi (Chek #...)"
```

---

## 3. Komponentlararo Aloqa Qoidalari

1. **Client → Server**: REST API, JWT Bearer token orqali. Admin barcha markazni, o‘qituvchi esa faqat o‘z kurs va guruhlarini ko‘radi.
2. **Bot → Server**: Maxfiy `INTERNAL_API_KEY` orqali. Telegramdagi harakatlar server biznes mantiqiga xavfsiz uzatiladi.
3. **Server → Telegram**:
   - Darsga kelmaganda ota-onaga zudlik bilan ogohlantirish.
   - Oldindan to‘lov eslatmasi (farzandga ham, uning bitta mas'ul ota-onasiga ham).
   - Darsdan 15 min oldingi eslatmalar.
4. **Foydalanuvchi-Ota-ona munosabati**:
   - Har bir o‘quvchiga faqat bitta ota-ona hisobi bog‘lanadi.
   - Bitta ota-onada bir nechta farzand bo‘lsa, to‘lov eslatmalari bitta umumiy xabarga jamlanadi.
