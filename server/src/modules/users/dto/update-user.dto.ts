import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'Alisher Qodirov' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, example: '+998901234567' })
  @IsString()
  @IsOptional()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone?: string;

  @ApiProperty({ required: false, example: 'NewPassword123!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false, example: '123456789' })
  @IsString()
  @IsOptional()
  telegramId?: string;

  @ApiProperty({ required: false, example: 'teacher@educenter.uz' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
