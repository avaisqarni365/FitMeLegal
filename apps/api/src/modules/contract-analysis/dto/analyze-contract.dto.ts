import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class AnalyzeContractDto {
  @ApiProperty({
    description: 'File name',
    example: 'employment_contract.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'File URL (from pre-uploaded file)',
    example: 'https://storage.fitmelegal.com/contracts/abc123.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 524288,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'Optional: document ID if analyzing saved document',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentId?: string;
}
