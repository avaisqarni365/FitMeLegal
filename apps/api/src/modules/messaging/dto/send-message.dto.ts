import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Thank you for your question. I can help you with that.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Optional attachments (URLs or file references)',
    example: ['https://example.com/document.pdf'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
