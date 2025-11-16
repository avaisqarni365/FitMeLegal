import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelMeetingDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Schedule conflict - need to reschedule',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
