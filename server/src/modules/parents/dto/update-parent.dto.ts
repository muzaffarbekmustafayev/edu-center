import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateParentDto {
  @ApiProperty({ example: 'Rustam Aliyev', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+998909876543', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsString()
  @IsOptional()
  telegramId?: string;
}
