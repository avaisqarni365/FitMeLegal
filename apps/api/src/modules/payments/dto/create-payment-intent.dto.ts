import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Order ID to create payment for',
    example: 'order-uuid-here',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Payment method ID (optional for test mode)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
