import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class DraftDocumentDto {
  @ApiProperty({
    description: 'Title for the drafted document',
    example: 'Non-Disclosure Agreement',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'User prompt describing what document to generate',
    example: 'Create a mutual non-disclosure agreement between two companies for sharing confidential information about a potential partnership. Include standard clauses for definition of confidential information, obligations, term duration (2 years), and governing law (Germany).',
  })
  @IsString()
  userPrompt: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Optional project ID to associate with',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}
