import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'Jasur Aliyev', description: 'O‘quvchining ismi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+998901234567', description: 'O‘quvchining telefon raqami' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone: string;

  @ApiProperty({ example: '123456789', required: false, description: 'Telegram ID' })
  @IsString()
  @IsOptional()
  telegramId?: string;

  @ApiProperty({
    example: 'cuid_parent_1',
    required: false,
    description: 'Mavjud mas‘ul ota yoki onaning ID si',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    example: '+998909876543',
    required: false,
    description: 'Yangi ota-onaning telefoni (agar parentId berilmagan bo‘lsa)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  parentPhone?: string;

  @ApiProperty({ example: 'Rustam Aliyev', required: false, description: 'Ota-onaning ismi' })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiProperty({ example: 'ota', required: false, description: 'Qarindoshlik (ota, ona, vasiy)' })
  @IsString()
  @IsOptional()
  parentRelation?: string;

  @ApiProperty({ enum: StudentStatus, default: StudentStatus.ACTIVE, required: false })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}
