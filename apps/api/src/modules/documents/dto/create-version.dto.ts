import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({
    description: 'New file URL',
    example: 'https://storage.fitmelegal.com/documents/abc123_v2.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 248952,
  })
  @IsNumber()
  fileSize: number;

  @ApiProperty({
    description: 'Description of changes',
    example: 'Updated payment terms in section 3.2',
    required: false,
  })
  @IsOptional()
  @IsString()
  changes?: string;
}
