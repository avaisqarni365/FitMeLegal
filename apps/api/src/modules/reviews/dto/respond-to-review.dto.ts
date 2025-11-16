import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RespondToReviewDto {
  @ApiProperty({
    description: 'Advisor response to the review',
    example: 'Thank you for your kind words! It was a pleasure working with you.',
  })
  @IsString()
  @MaxLength(1000)
  response: string;
}
