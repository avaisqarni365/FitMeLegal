import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray, IsJSON } from 'class-validator';

export enum TemplateCategory {
  CONTRACT = 'CONTRACT',
  AGREEMENT = 'AGREEMENT',
  LEGAL_NOTICE = 'LEGAL_NOTICE',
  BUSINESS_FORMATION = 'BUSINESS_FORMATION',
  EMPLOYMENT = 'EMPLOYMENT',
  REAL_ESTATE = 'REAL_ESTATE',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  TAX_FILING = 'TAX_FILING',
  COMPLIANCE = 'COMPLIANCE',
  OTHER = 'OTHER',
}

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Software Development Agreement',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'A comprehensive software development agreement template',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Template category',
    enum: TemplateCategory,
    example: TemplateCategory.CONTRACT,
  })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({
    description: 'Template subcategory',
    example: 'Software & Technology',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    description: 'Template content with variables in {{variable_name}} format',
    example: 'This agreement is made between {{client_name}} and {{developer_name}} on {{date}}...',
  })
  @IsString()
  templateContent: string;

  @ApiProperty({
    description: 'Template variables definition',
    example: [
      { name: 'client_name', type: 'text', description: 'Client full name', required: true },
      { name: 'developer_name', type: 'text', description: 'Developer full name', required: true },
      { name: 'date', type: 'date', description: 'Agreement date', required: true },
    ],
    type: 'array',
  })
  @IsArray()
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'textarea';
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;

  @ApiProperty({
    description: 'Make template publicly available',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'Template price (null for free)',
    example: 29.99,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Template tags',
    example: ['software', 'contract', 'development'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({
    description: 'Template language',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}
