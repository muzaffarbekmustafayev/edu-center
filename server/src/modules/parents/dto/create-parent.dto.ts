import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateParentDto {
  @ApiProperty({ example: 'Rustam Aliyev', description: 'Ota yoki onaning ismi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+998909876543', description: 'Telefon raqam' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone: string;

  @ApiProperty({ example: '123456789', required: false, description: 'Telegram ID' })
  @IsString()
  @IsOptional()
  telegramId?: string;
}
