import { IsString, IsNumber, Min, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ example: 'Based on my review of your situation...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
