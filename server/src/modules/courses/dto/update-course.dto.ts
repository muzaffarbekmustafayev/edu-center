import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'Ingliz tili (IELTS Foundation)', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 500000,
    required: false,
    description: 'Yangi narx (faqat kelgusida ochiladigan to‘lov sikllariga ta‘sir qiladi)',
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  lessonCount?: number;

  @ApiProperty({ example: 'Tavsif', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'cuid_teacher_1', required: false })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
