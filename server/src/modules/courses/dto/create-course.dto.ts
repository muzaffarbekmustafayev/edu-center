import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Ingliz tili (IELTS Foundation)', description: 'Kurs nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 450000, description: '12 darslik to‘lov narxi (so‘mda)' })
  @IsInt()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 12, default: 12, required: false, description: 'Bir sikldagi darslar soni' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  lessonCount?: number;

  @ApiProperty({ example: 'Noldan IELTS 6.5 gacha tayyorgarlik kursi', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'cuid_teacher_1', description: 'Mas‘ul o‘qituvchi ID si' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;
}
