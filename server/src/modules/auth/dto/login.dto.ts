import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Telefon raqam' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati noto‘g‘ri (+998XXXXXXXXX)' })
  phone: string;

  @ApiProperty({ example: 'Admin123!', description: 'Foydalanuvchi paroli' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Parol kamida 6 belgidan iborat bo‘lishi kerak' })
  password: string;
}
