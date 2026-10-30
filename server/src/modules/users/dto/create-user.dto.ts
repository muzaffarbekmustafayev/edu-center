import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Alisher Qodirov', description: 'Xodimning to‘liq ismi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone: string;

  @ApiProperty({ example: 'Teacher123!', description: 'Veb-panel uchun parol' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak' })
  password: string;

  @ApiProperty({ enum: Role, default: Role.TEACHER, description: 'Xodim roli' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    example: '123456789',
    required: false,
    description: 'Telegram ID (O‘qituvchini botda avtomatik tanish uchun)',
  })
  @IsString()
  @IsOptional()
  telegramId?: string;

  @ApiProperty({ example: 'teacher@educenter.uz', required: false })
  @IsString()
  @IsOptional()
  email?: string;
}
