import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for an order' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  @ApiResponse({ status: 400, description: 'Invalid order or already paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentIntent(
    @CurrentUser() user: any,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      createPaymentIntentDto.orderId,
      user.id,
    );
  }

  @Get('order/:orderId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, user.id);
  }

  @Post('test-payment/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Simulate test payment (Development only)',
    description:
      'Automatically creates and confirms a test payment for development/testing purposes',
  })
  @ApiResponse({ status: 200, description: 'Test payment successful' })
  @ApiResponse({ status: 400, description: 'Invalid order or already paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async simulateTestPayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.simulateTestPayment(orderId, user.id);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!request.rawBody) {
      throw new Error('Raw body not available');
    }

    // Construct and verify webhook event
    const event = this.stripeService.constructWebhookEvent(
      request.rawBody,
      signature,
    );

    // Process the event
    await this.paymentsService.handleWebhookEvent(event);

    return { received: true };
  }
}
