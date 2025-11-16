import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class UpdateMeetingDto {
  @ApiProperty({
    description: 'Updated meeting title',
    example: 'Rescheduled: Tax consultation',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Updated description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'New scheduled start time',
    example: '2024-12-02T14:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiProperty({
    description: 'New scheduled end time',
    example: '2024-12-02T15:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiProperty({
    description: 'Meeting notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
