import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum VerificationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  VERIFY = 'VERIFY', // Upgrade verification level
}

export class VerifyAdvisorDto {
  @ApiProperty({
    description: 'Verification action to perform',
    enum: VerificationAction,
    example: VerificationAction.APPROVE,
  })
  @IsEnum(VerificationAction)
  action: VerificationAction;

  @ApiProperty({
    description: 'Notes or reason for the action',
    example: 'All documents verified. Professional credentials confirmed.',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'New verification level (for VERIFY action)',
    example: 'ENHANCED',
    required: false,
  })
  @IsOptional()
  @IsString()
  verificationLevel?: 'BASIC' | 'PROFESSIONAL' | 'ENHANCED';
}
