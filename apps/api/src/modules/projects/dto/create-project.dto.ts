import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Q4 2024 Tax Documents',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Workspace for organizing tax-related documents for Q4 2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of user IDs who have access to this project',
    example: ['user-uuid-1', 'user-uuid-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  members?: string[] = [];

  @ApiProperty({
    description: 'Make project publicly visible',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiProperty({
    description: 'Order ID if this project is related to an order',
    example: 'order-uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['tax', 'legal', 'Q4-2024'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];
}
