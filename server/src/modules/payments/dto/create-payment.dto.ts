import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 'cuid_cycle_1', description: 'To‘lanayotgan PaymentCycle ID si' })
  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @ApiProperty({ example: 450000, description: 'Qabul qilingan summa (so‘mda)' })
  @IsInt()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CARD, description: 'To‘lov usuli' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'Karta orqali to‘lov, chek №8391', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
