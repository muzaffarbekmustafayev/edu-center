import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({ example: 'cuid_student_1', description: 'Guruhga qo‘shiladigan o‘quvchi ID si' })
  @IsString()
  @IsNotEmpty()
  studentId: string;
}
