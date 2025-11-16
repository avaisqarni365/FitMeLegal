import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({
    description: 'Reason for suspension',
    example: 'Violation of terms of service',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Additional details',
    required: false,
  })
  @IsOptional()
  @IsString()
  details?: string;
}
