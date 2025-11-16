import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'No longer needed',
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}
