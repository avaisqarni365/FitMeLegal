import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Cancel at period end (true) or immediately (false)',
    example: true,
    default: true,
  })
  @IsBoolean()
  cancelAtPeriodEnd: boolean = true;

  @ApiProperty({
    description: 'Reason for cancellation (optional)',
    example: 'No longer need the service',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
