import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ServiceCategory {
  LEGAL = 'LEGAL',
  TAX = 'TAX',
}

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service category',
    enum: ServiceCategory,
    example: 'LEGAL',
  })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiProperty({
    description: 'Service subcategory',
    example: 'contract-review',
  })
  @IsString()
  @MaxLength(100)
  subcategory: string;

  @ApiProperty({
    description: 'Service title',
    example: 'Employment Contract Review',
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Detailed service description',
    example:
      'I will review your employment contract and provide detailed feedback on key terms, potential issues, and recommendations.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Service price in EUR',
    example: 150.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
    default: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Delivery time in days',
    example: 3,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  deliveryTime: number;

  @ApiProperty({
    description: 'Number of revisions included',
    example: 2,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  revisions?: number;

  @ApiProperty({
    description: 'List of requirements from client',
    example: ['Copy of employment contract', 'Current salary information'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({
    description: 'List of deliverables',
    example: [
      'Detailed review document (PDF)',
      '30-minute video consultation',
    ],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  deliverables: string[];

  @ApiProperty({
    description: 'Languages this service is available in',
    example: ['en', 'de'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({
    description: 'Service tags for discoverability',
    example: ['employment', 'contract-review', 'labor-law'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
