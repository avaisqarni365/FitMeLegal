import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum BillingPeriodDto {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export class SubscribeDto {
  @ApiProperty({
    description: 'Subscription plan slug (basic, professional, business)',
    example: 'professional',
    enum: ['basic', 'professional', 'business'],
  })
  @IsString()
  planSlug: string;

  @ApiProperty({
    description: 'Billing period (MONTHLY or ANNUAL)',
    example: 'MONTHLY',
    enum: BillingPeriodDto,
  })
  @IsEnum(BillingPeriodDto)
  billingPeriod: BillingPeriodDto;

  @ApiProperty({
    description: 'Stripe payment method ID (from Stripe Elements)',
    example: 'pm_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({
    description: 'Start with trial period (14 days)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  startTrial?: boolean = false;
}
