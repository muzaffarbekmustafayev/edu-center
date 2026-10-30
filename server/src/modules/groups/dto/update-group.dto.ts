import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { GroupStatus } from '@prisma/client';

export class UpdateGroupDto {
  @ApiProperty({ example: 'IELTS Foundation - 1', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'cuid_course_1', required: false })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({ example: 'cuid_teacher_1', required: false })
  @IsString()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ example: '304-xona', required: false })
  @IsString()
  @IsOptional()
  room?: string;

  @ApiProperty({ example: 90, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  durationMin?: number;

  @ApiProperty({ enum: GroupStatus, required: false })
  @IsEnum(GroupStatus)
  @IsOptional()
  status?: GroupStatus;
}
