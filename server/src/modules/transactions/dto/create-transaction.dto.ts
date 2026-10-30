import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TxType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: TxType, example: TxType.EXPENSE, description: 'Kirim yoki Chiqim' })
  @IsEnum(TxType)
  type: TxType;

  @ApiProperty({
    example: 'rent',
    description: 'Kategoriya: salary, rent, utilities, marketing, equipment, repair, other, tuition',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 3500000, description: 'Summa (so‘mda)' })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Noyabr oyi bino ijarasi', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z', required: false })
  @IsString()
  @IsOptional()
  date?: string;
}
