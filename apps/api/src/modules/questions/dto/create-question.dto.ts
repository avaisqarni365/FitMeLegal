import { IsEnum, IsString, IsNumber, Min, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionCategory, UrgencyLevel } from '@fitmelegal/shared';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionCategory, example: QuestionCategory.LEGAL })
  @IsEnum(QuestionCategory)
  category: QuestionCategory;

  @ApiProperty({ example: 'corporate' })
  @IsString()
  subcategory: string;

  @ApiProperty({ example: 'Need help with employment contract' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'I need to review my employment contract before signing...' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiPropertyOptional({ enum: UrgencyLevel, example: UrgencyLevel.NORMAL })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  attachments?: any[];
}
