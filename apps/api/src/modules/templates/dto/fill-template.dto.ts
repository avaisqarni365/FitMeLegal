import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class FillTemplateDto {
  @ApiProperty({
    description: 'Template ID to use',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Variable values to fill in the template',
    example: {
      client_name: 'John Doe',
      developer_name: 'Jane Smith',
      date: '2025-11-16',
      project_description: 'Development of mobile application',
      price: '50000',
    },
  })
  @IsObject()
  variables: Record<string, string>;

  @ApiProperty({
    description: 'Optional title for the drafted document',
    example: 'Software Development Agreement - John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
