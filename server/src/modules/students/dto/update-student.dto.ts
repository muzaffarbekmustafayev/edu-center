import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
  @ApiProperty({ example: 'Jasur Aliyev', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\+998\d{9}$/, { message: 'Telefon raqam formati: +998XXXXXXXXX' })
  phone?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsString()
  @IsOptional()
  telegramId?: string;

  @ApiProperty({ example: 'cuid_parent_1', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 'ona', required: false })
  @IsString()
  @IsOptional()
  parentRelation?: string;

  @ApiProperty({ enum: StudentStatus, required: false })
  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;
}
