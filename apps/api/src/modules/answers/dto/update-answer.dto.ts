import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnswerStatus } from '@fitmelegal/shared';

export class UpdateAnswerDto {
  @ApiPropertyOptional({ example: 'Updated answer content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 200.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: AnswerStatus })
  @IsOptional()
  @IsEnum(AnswerStatus)
  status?: AnswerStatus;
}
