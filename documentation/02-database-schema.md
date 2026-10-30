# 02. Ma’lumotlar Bazasi Sxemasi (Database Schema)

Ushbu hujjatda **Edu Center** tizimining PostgreSQL ma’lumotlar bazasi tuzilmasi, barcha modellar, ularning maydonlari, munosabatlari, enumlari, indekslari va xavfsizlik qoidalari keltirilgan.

> **Asosiy qoidalar (v1.4)**:
> 1. **O‘qituvchi**: Admin paneldan `telegramId` si bilan qo‘shiladi. Botga yozganida tizim uning Telegram ID si orqali darhol **TEACHER** ekanligini aniqlaydi.
> 2. **O‘quvchi va Ota-ona**: Botga yangi kirgan foydalanuvchi avtomatik **STUDENT** bo‘ladi. Ro‘yxatdan o‘tishda o‘z raqamini va **ota-onasining kontaktini** ulashadi. Har bir farzandga aynan bitta mas'ul ota yoki ona biriktiriladi (`Student.parentId`).
> 3. **To‘lov modeli — Oldindan to‘lov (Prepay)**: Har 12 darslik to‘lov sikli darslar boshlanishidan oldin to‘lanadi.
> 4. **Darsga kelmaganlik xabarnomasi (`STUDENT_ABSENT`)**: O‘quvchi kelmasa (`ABSENT`), ota-onaga zudlik bilan Telegram xabar boradi.
> 5. **Kelsa va kelmasa ham dars hisoblanishi**: Dars o‘tgach, `PRESENT` va `ABSENT` har ikkalasida ham 12 darslik paketdan 1 dars sarflanadi (`lessonsDone++`).

---

## 1. To‘liq Prisma Sxemasi (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMLAR (ENUMERATIONS)
// -------------------------------------------------------------

enum Role {
  ADMIN
  TEACHER
}

enum Language {
  UZ
  EN
}

enum StudentStatus {
  ACTIVE
  INACTIVE
}

enum GroupStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum EnrollmentStatus {
  ACTIVE
  SUSPENDED
  DROPPED
  COMPLETED
}

enum LessonStatus {
  SCHEDULED
  DONE
  CANCELLED
}

enum AttendanceStatus {
  NOT_SENT
  SENT
  IN_PROGRESS
  DONE
}

enum AttendanceState {
  PRESENT
  ABSENT
  EXCUSED
}

enum MarkedVia {
  BOT
  WEB
}

enum PaymentStatus {
  PENDING   // To'lov kutilmoqda (oldindan to'lash kerak)
  PAID      // To'langan (darslar o'tilishi mumkin)
  OVERDUE   // Dars boshlandi yoki belgilangan muddat o'tib ketdi, lekin to'lanmadi
}

enum PaymentMethod {
  CASH
  CARD
  BANK
}

enum TxType {
  INCOME
  EXPENSE
}

enum RecipientType {
  STUDENT
  PARENT
  TEACHER
}

enum NotifStatus {
  PENDING
  SENT
  FAILED
}

enum NotificationType {
  LESSON_REMINDER
  PAYMENT_DUE        // Oldindan to'lov eslatmasi (Farzand va Ota-onaga)
  PAYMENT_OVERDUE    // Kechikkan to'lov eslatmasi (Farzand va Ota-onaga)
  PAYMENT_RECEIVED   // To'lov kvitansiyasi (Farzand va Ota-onaga)
  STUDENT_ABSENT     // Darsga kelmaganlik to'g'risida zudlik bilan ota-onaga xabar
  ABSENCE_WARNING    // Ketma-ket dars qoldirish bo'yicha ogohlantirish
  DROPPED_FROM_GROUP // Guruhdan to'xtatilganlik xabari
  LESSON_CANCELLED   // Dars bekor qilinganlik xabari
  ATTENDANCE_REQUEST // O'qituvchiga dars boshlanganda "Yo'qlamani boshlash" so'rovi
}

// -------------------------------------------------------------
// MODELLAR (MODELS)
// -------------------------------------------------------------

/// Tizim xodimlari: Admin va O'qituvchilar (Veb panel va bot foydalanuvchilari)
/// O'qituvchi yaratilganda uning Telegram ID si kiritiladi — bot uni darhol taniydi.
model User {
  id            String    @id @default(cuid())
  role          Role
  name          String
  phone         String    @unique
  email         String?   @unique
  passwordHash  String
  telegramId    String?   @unique // O'qituvchi uchun admin paneldan kiritiladi
  language      Language  @default(UZ)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  deletedAt     DateTime?

  // Munosabatlar
  courses       Course[]
  groups        Group[]

  @@index([role, isActive])
  @@index([telegramId])
}

/// Ota-ona modeli (Faqat Telegram bot orqali muloqot qiladi)
model Parent {
  id            String    @id @default(cuid())
  name          String
  phone         String    @unique
  telegramId    String?   @unique
  language      Language  @default(UZ)
  createdAt     DateTime  @default(now())
  deletedAt     DateTime?

  // Bitta ota-onaning bir nechta farzandi bo'lishi mumkin (1:N)
  children      Student[]
}

/// O'quvchi modeli (Faqat Telegram bot orqali muloqot qiladi)
/// Har bir o'quvchiga bitta mas'ul ota yoki ona biriktiriladi (parentId)
model Student {
  id             String        @id @default(cuid())
  name           String
  phone          String        @unique
  telegramId     String?       @unique
  language       Language      @default(UZ)
  status         StudentStatus @default(ACTIVE)
  
  // Mas'ul ota yoki ona bilan 1:1 bog'liqlik (har bir farzand uchun bitta ota/ona)
  parentId       String?
  parent         Parent?       @relation(fields: [parentId], references: [id])
  parentRelation String?       // Masalan: "ota", "ona", "vasiy"

  createdAt      DateTime      @default(now())
  deletedAt      DateTime?

  // Munosabatlar
  enrollments    Enrollment[]
  attendances    Attendance[]

  @@index([status])
  @@index([parentId])
  @@index([telegramId])
}

/// O'quv kursi (Fan yo'nalishi)
model Course {
  id            String    @id @default(cuid())
  name          String
  price         Int       // O'zbekiston so'mida, butun son
  lessonCount   Int       @default(12)
  description   String?
  teacherId     String
  teacher       User      @relation(fields: [teacherId], references: [id])
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  // Munosabatlar
  groups        Group[]

  @@index([teacherId])
}

/// O'quv guruhi
model Group {
  id            String          @id @default(cuid())
  name          String
  courseId      String
  course        Course          @relation(fields: [courseId], references: [id])
  teacherId     String
  teacher       User            @relation(fields: [teacherId], references: [id])
  room          String?
  startDate     DateTime
  durationMin   Int             @default(90) // Guruh yaratilganda dars davomiyligi (daqiqada)
  status        GroupStatus     @default(ACTIVE)
  createdAt     DateTime        @default(now())
  deletedAt     DateTime?

  // Munosabatlar
  schedules     GroupSchedule[]
  lessons       Lesson[]
  enrollments   Enrollment[]

  @@index([courseId])
  @@index([teacherId])
  @@index([status])
}

/// Guruhning haftalik dars jadvali
model GroupSchedule {
  id            String    @id @default(cuid())
  groupId       String
  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  dayOfWeek     Int       // 1 = Dushanba, 2 = Seshanba, ..., 7 = Yakshanba
  startTime     String    // "HH:mm" formatida, masalan "14:00"
  durationMin   Int       @default(90)

  @@index([groupId, dayOfWeek])
}

/// Aniq sana va vaqtga belgilangan dars
model Lesson {
  id                String            @id @default(cuid())
  groupId           String
  group             Group             @relation(fields: [groupId], references: [id])
  scheduledAt       DateTime
  status            LessonStatus      @default(SCHEDULED)
  attendanceSentAt  DateTime?
  attendanceStatus  AttendanceStatus  @default(NOT_SENT)
  cancelledAt       DateTime?
  cancelReason      String?
  createdAt         DateTime          @default(now())

  // Munosabatlar
  attendances       Attendance[]

  @@index([groupId, scheduledAt])
  @@index([scheduledAt, status])
}

/// O'quvchining guruhga a'zoligi (shartnomasi)
model Enrollment {
  id                   String           @id @default(cuid())
  studentId            String
  student              Student          @relation(fields: [studentId], references: [id])
  groupId              String
  group                Group            @relation(fields: [groupId], references: [id])
  enrolledAt           DateTime         @default(now())
  freeLessonsUsed      Int              @default(0)   // 0..2 (sinov darslari)
  lessonsDone          Int              @default(0)   // Joriy to'lov siklida qatnashilgan darslar soni (0..12)
  consecutiveAbsences  Int              @default(0)   // Ketma-ket darsga kelmaganlar soni
  status               EnrollmentStatus @default(ACTIVE)

  // Munosabatlar
  paymentCycles        PaymentCycle[]
  attendances          Attendance[]

  @@unique([studentId, groupId])
  @@index([groupId, status])
  @@index([studentId])
}

/// Dars bo'yicha o'quvchining davomat qaydnomasi
model Attendance {
  id           String           @id @default(cuid())
  lessonId     String
  lesson       Lesson           @relation(fields: [lessonId], references: [id])
  studentId    String
  student      Student          @relation(fields: [studentId], references: [id])
  enrollmentId String
  enrollment   Enrollment       @relation(fields: [enrollmentId], references: [id])
  status       AttendanceState  // PRESENT | ABSENT | EXCUSED
  markedVia    MarkedVia        @default(BOT)
  markedAt     DateTime         @default(now())

  @@unique([lessonId, studentId])
  @@index([enrollmentId])
  @@index([studentId])
}

/// 12 darslik to'lov sikli (OLDINDAN TO'LOV — PREPAY)
model PaymentCycle {
  id               String        @id @default(cuid())
  enrollmentId     String
  enrollment       Enrollment    @relation(fields: [enrollmentId], references: [id])
  cycleNo          Int           // 1, 2, 3...
  lessonsRequired  Int           @default(12)
  lessonsDone      Int           @default(0)   // Sikl davomida o'tilgan darslar (0..12)
  amount           Int           // Sikl uchun to'lanishi kerak bo'lgan summa (so'm)
  status           PaymentStatus @default(PENDING) // Oldindan to'lanishi kutiladi
  dueAt            DateTime?     // To'lov amalga oshirilishi kerak bo'lgan oxirgi sana
  paidAt           DateTime?     // Haqiqiy to'lov amalga oshirilgan sana
  createdAt        DateTime      @default(now())

  // Munosabatlar
  payments         Payment[]

  @@unique([enrollmentId, cycleNo])
  @@index([status, dueAt])
}

/// Haqiqiy qabul qilingan to'lov tranzaksiyasi
model Payment {
  id            String        @id @default(cuid())
  cycleId       String
  cycle         PaymentCycle  @relation(fields: [cycleId], references: [id])
  amount        Int           // To'langan summa (so'm)
  method        PaymentMethod // CASH | CARD | BANK
  paidAt        DateTime      @default(now())
  recordedBy    String        // Admin user ID
  note          String?

  @@index([cycleId])
  @@index([paidAt])
}

/// Markazning umumiy moliyaviy kirim va chiqim harakatlari
model Transaction {
  id          String    @id @default(cuid())
  type        TxType    // INCOME | EXPENSE
  category    String    // "tuition", "salary", "rent", "utilities", "marketing", "equipment", "other"
  amount      Int       // Summa (so'm)
  note        String?
  date        DateTime  @default(now())
  createdBy   String    // Amaliyotni bajargan user ID
  createdAt   DateTime  @default(now())

  @@index([type, date])
  @@index([category])
}

/// Yuborilgan va yuborilishi kutilayotgan xabarlar (Audit & Idempotency)
model Notification {
  id            String           @id @default(cuid())
  recipientType RecipientType    // STUDENT | PARENT | TEACHER
  recipientId   String           // User, Student yoki Parent IDsi
  telegramId    String           // Telegram chat/user ID
  type          NotificationType
  refId         String?          // Idempotentlik kaliti (lessonId, cycleId va h.k.)
  language      Language
  content       String           // Yuborilgan matn
  status        NotifStatus      @default(PENDING)
  sentAt        DateTime?
  errorReason   String?
  createdAt     DateTime         @default(now())

  @@unique([recipientType, recipientId, type, refId])
  @@index([status, createdAt])
}

/// Tizimda sodir bo'lgan muhim amallar audit logi
model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?  // Amaliyotni bajargan User ID (tizim bo'lsa null)
  actorRole   String   // "ADMIN", "TEACHER", "SYSTEM"
  action      String   // "payment.create", "enrollment.drop", "attendance.save", va h.k.
  entity      String   // "Payment", "Enrollment", "Group"
  entityId    String   // Ta'sir qilingan obyekt IDsi
  before      Json?    // O'zgartirishdan oldingi holat
  after       Json?    // O'zgartirishdan keyingi holat
  createdAt   DateTime @default(now())

  @@index([entity, entityId])
  @@index([actorId])
  @@index([createdAt])
}
```
