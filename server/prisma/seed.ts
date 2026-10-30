import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Boshlang‘ich ma‘lumotlarni kiritish (Seeding)...');

  // 1. Standart Admin yaratish
  const adminPhone = '+998901234567';
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    await prisma.user.create({
      data: {
        name: 'Asosiy Administrator',
        phone: adminPhone,
        email: 'admin@educenter.uz',
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log('✅ Admin yaratildi: +998901234567 / AdminPassword123!');
  } else {
    console.log('ℹ️ Admin allaqachon mavjud.');
  }

  // 2. Namuna O'qituvchi yaratish (Telegram ID bilan)
  const teacherPhone = '+998907654321';
  const existingTeacher = await prisma.user.findUnique({
    where: { phone: teacherPhone },
  });

  if (!existingTeacher) {
    const passwordHash = await bcrypt.hash('TeacherPassword123!', 10);
    const teacher = await prisma.user.create({
      data: {
        name: 'Alisher Qodirov (Namuna O‘qituvchi)',
        phone: teacherPhone,
        email: 'teacher@educenter.uz',
        passwordHash,
        role: Role.TEACHER,
        telegramId: '987654321', // Namuna Telegram ID
      },
    });
    console.log('✅ O‘qituvchi yaratildi: +998907654321 (Telegram ID: 987654321)');

    // Namuna kurs
    await prisma.course.create({
      data: {
        name: 'Ingliz tili (IELTS Foundation)',
        price: 450000,
        lessonCount: 12,
        teacherId: teacher.id,
        description: 'Boshlang‘ich darajadan IELTS tayyorgarligi',
      },
    });
    console.log('✅ Namuna kurs yaratildi.');
  } else {
    console.log('ℹ️ O‘qituvchi allaqachon mavjud.');
  }
}

main()
  .catch((e) => {
    console.error('Seeding jarayonida xatolik:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
