import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class ReviewFilterDto {
  @ApiProperty({
    description: 'Filter by minimum rating',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Show only verified reviews',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verifiedOnly?: boolean = false;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
