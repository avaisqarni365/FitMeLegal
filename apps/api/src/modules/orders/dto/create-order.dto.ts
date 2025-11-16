import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Client requirements for the service',
    example: {
      documentUrl: 'https://example.com/contract.pdf',
      additionalInfo: 'Please review urgently',
    },
  })
  @IsObject()
  requirements: Record<string, any>;

  @ApiProperty({
    description: 'Additional notes for the advisor',
    example: 'I need this reviewed before signing next week',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
