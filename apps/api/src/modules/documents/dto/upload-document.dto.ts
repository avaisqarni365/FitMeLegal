import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Project ID where document will be uploaded',
    example: 'project-uuid',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Document name',
    example: 'Contract_Draft_v1.pdf',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Document description',
    example: 'Initial draft of service agreement',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'File URL (from S3 or storage)',
    example: 'https://storage.fitmelegal.com/documents/abc123.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 245678,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'Tags for categorization',
    example: ['contract', 'legal', 'draft'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];
}
