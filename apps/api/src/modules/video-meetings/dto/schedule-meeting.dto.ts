import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class ScheduleMeetingDto {
  @ApiProperty({
    description: 'ID of the user you want to meet with',
    example: 'user-uuid',
  })
  @IsUUID()
  attendeeId: string;

  @ApiProperty({
    description: 'Meeting title',
    example: 'Tax consultation for Q4 2024',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Meeting description (optional)',
    example: 'Discuss tax optimization strategies for the upcoming quarter',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Scheduled start time (ISO 8601 format)',
    example: '2024-12-01T14:00:00Z',
  })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({
    description: 'Scheduled end time (ISO 8601 format)',
    example: '2024-12-01T15:00:00Z',
  })
  @IsDateString()
  scheduledEnd: string;

  @ApiProperty({
    description: 'Timezone (IANA timezone identifier)',
    example: 'Europe/Berlin',
    default: 'UTC',
    required: false,
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @ApiProperty({
    description: 'Enable recording for this meeting',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean = false;

  @ApiProperty({
    description: 'Order ID if this meeting is related to an order',
    example: 'order-uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
