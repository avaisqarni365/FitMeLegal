import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'ID of the user to start conversation with',
    example: 'user-uuid-here',
  })
  @IsString()
  receiverId: string;

  @ApiProperty({
    description: 'Optional order ID if conversation is related to an order',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({
    description: 'Optional conversation subject',
    example: 'Question about contract review service',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({
    description: 'Initial message content',
    example: 'Hi, I have a question about your contract review service.',
  })
  @IsString()
  initialMessage: string;
}
