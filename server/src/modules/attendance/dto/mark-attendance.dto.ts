import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceState } from '@prisma/client';

export class StudentAttendanceItemDto {
  @ApiProperty({ example: 'cuid_student_1', description: 'O‘quvchi ID si' })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ enum: AttendanceState, example: AttendanceState.PRESENT })
  @IsEnum(AttendanceState)
  status: AttendanceState;
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [StudentAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceItemDto)
  attendances: StudentAttendanceItemDto[];
}
