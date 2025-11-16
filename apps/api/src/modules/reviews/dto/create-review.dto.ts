import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the advisor being reviewed',
    example: 'advisor-uuid-here',
  })
  @IsString()
  advisorId: string;

  @ApiProperty({
    description: 'Order ID if reviewing a completed order',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    description: 'Service ID if reviewing a specific service',
    required: false,
  })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({
    description: 'Question ID if reviewing a Q&A interaction',
    required: false,
  })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent service! Very professional and thorough contract review.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
