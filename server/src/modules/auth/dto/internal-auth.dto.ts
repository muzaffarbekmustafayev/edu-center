import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class LinkTelegramDto {
  @ApiProperty({ example: '123456789', description: 'Telegram chat/user ID' })
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone: string;
}

export class RegisterStudentWithParentDto {
  @ApiProperty({ example: '123456789', description: 'O‘quvchining Telegram ID si' })
  @IsString()
  @IsNotEmpty()
  studentTelegramId: string;

  @ApiProperty({ example: '+998901234567', description: 'O‘quvchining telefon raqami' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  studentPhone: string;

  @ApiProperty({ example: 'Jasur Aliyev', description: 'O‘quvchining ismi' })
  @IsString()
  @IsNotEmpty()
  studentName: string;

  @ApiProperty({ example: '+998909876543', description: 'Ota-onaning telefon raqami' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  parentPhone: string;

  @ApiProperty({ example: 'Rustam Aliyev', required: false, description: 'Ota-onaning ismi' })
  @IsString()
  @IsOptional()
  parentName?: string;
}
