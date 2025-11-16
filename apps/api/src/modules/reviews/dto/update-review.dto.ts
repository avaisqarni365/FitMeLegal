import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  rating?: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Updated: Even better than I initially thought!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
