import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GroupScheduleItemDto {
  @ApiProperty({ example: 1, description: 'Hafta kuni: 1=Dushanba ... 7=Yakshanba' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: '14:00', description: 'Boshlanish vaqti HH:mm formatida' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Vaqt formati HH:mm bo‘lishi kerak (masalan, 14:00)',
  })
  startTime: string;

  @ApiProperty({ example: 90, default: 90, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  durationMin?: number;
}

export class CreateGroupDto {
  @ApiProperty({ example: 'IELTS Foundation - 1', description: 'Guruh nomi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'cuid_course_1', description: 'Kurs ID si' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'cuid_teacher_1', description: 'Mas‘ul o‘qituvchi ID si' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({ example: '304-xona', required: false, description: 'Dars xonasi' })
  @IsString()
  @IsOptional()
  room?: string;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z', description: 'Dars boshlanish sanasi' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: 90, default: 90, required: false, description: 'Dars davomiyligi (daqiqada)' })
  @IsInt()
  @IsPositive()
  @IsOptional()
  durationMin?: number;

  @ApiProperty({ type: [GroupScheduleItemDto], description: 'Haftalik dars jadvali' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupScheduleItemDto)
  schedules: GroupScheduleItemDto[];
}
