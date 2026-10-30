import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelLessonDto {
  @ApiProperty({
    example: 'O‘qituvchi betobligi sababli dars qoldirildi',
    description: 'Bekor qilish sababi',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
