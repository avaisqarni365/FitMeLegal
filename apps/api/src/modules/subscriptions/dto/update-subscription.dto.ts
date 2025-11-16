import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { BillingPeriodDto } from './subscribe.dto';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'New plan slug to upgrade/downgrade to',
    example: 'business',
    enum: ['basic', 'professional', 'business'],
  })
  @IsString()
  newPlanSlug: string;

  @ApiProperty({
    description: 'Billing period for new plan',
    example: 'ANNUAL',
    enum: BillingPeriodDto,
    required: false,
  })
  @IsOptional()
  @IsEnum(BillingPeriodDto)
  billingPeriod?: BillingPeriodDto;
}
