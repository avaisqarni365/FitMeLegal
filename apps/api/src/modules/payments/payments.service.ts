import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  /**
   * Create payment intent for an order
   */
  async createPaymentIntent(orderId: string, userId: string) {
    // Get order with all details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        service: {
          include: {
            advisor: true,
          },
        },
        client: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify client ownership
    if (order.clientId !== userId) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    // Check order status
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Payment can only be made for pending or confirmed orders',
      );
    }

    // Check if payment already exists
    if (order.paymentId) {
      const existingPayment = await this.stripeService.getPaymentIntent(
        order.paymentId,
      );
      if (existingPayment.status === 'succeeded') {
        throw new BadRequestException('Order has already been paid');
      }
      // Return existing payment intent if not completed
      return {
        paymentIntentId: existingPayment.id,
        clientSecret: existingPayment.client_secret,
        amount: order.price,
        currency: order.currency,
        status: existingPayment.status,
      };
    }

    // Create new payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      Number(order.price),
      order.currency,
      {
        orderId: order.id,
        clientId: order.clientId,
        serviceId: order.serviceId,
        advisorId: order.service.advisorId,
      },
    );

    // Update order with payment intent ID
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: paymentIntent.id,
        paymentStatus: 'PROCESSING',
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: order.price,
      currency: order.currency,
      status: paymentIntent.status,
    };
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        service: {
          include: {
            advisor: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify access
    const isClient = order.clientId === userId;
    const isAdvisor = order.service.advisor.userId === userId;

    if (!isClient && !isAdvisor) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    if (!order.paymentId) {
      return {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        amount: order.price,
        currency: order.currency,
        stripeStatus: null,
      };
    }

    // Get Stripe payment intent status
    const paymentIntent = await this.stripeService.getPaymentIntent(
      order.paymentId,
    );

    return {
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      amount: order.price,
      currency: order.currency,
      stripeStatus: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Handle successful payment (called by webhook or manual confirmation)
   */
  async handlePaymentSuccess(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.getPaymentIntent(
      paymentIntentId,
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not succeeded');
    }

    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      this.logger.error('Payment intent missing orderId in metadata');
      throw new BadRequestException('Invalid payment intent metadata');
    }

    // Update order payment status
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCEEDED',
        paidAt: new Date(),
        status: 'CONFIRMED', // Move to confirmed if still pending
      },
      include: {
        service: true,
      },
    });

    this.logger.log(`Payment succeeded for order ${orderId}`);
    return order;
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailure(paymentIntentId: string) {
    const paymentIntent = await this.stripeService.getPaymentIntent(
      paymentIntentId,
    );

    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      this.logger.error('Payment intent missing orderId in metadata');
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });

    this.logger.log(`Payment failed for order ${orderId}`);
  }

  /**
   * Create refund for an order
   */
  async createRefund(orderId: string, adminUserId: string, amount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.paymentId) {
      throw new BadRequestException('No payment found for this order');
    }

    if (order.paymentStatus !== 'SUCCEEDED') {
      throw new BadRequestException('Can only refund successful payments');
    }

    // Create refund in Stripe
    const refund = await this.stripeService.createRefund(
      order.paymentId,
      amount ? Number(amount) : undefined,
    );

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      },
    });

    this.logger.log(`Refund created for order ${orderId}: ${refund.id}`);
    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  /**
   * Process Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event) {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(
          (event.data.object as Stripe.PaymentIntent).id,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(
          (event.data.object as Stripe.PaymentIntent).id,
        );
        break;

      case 'charge.refunded':
        // Handle refund confirmation if needed
        this.logger.log('Charge refunded event received');
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Simulate test payment (for development only)
   */
  async simulateTestPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        service: {
          include: {
            advisor: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== userId) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    if (order.paymentStatus === 'SUCCEEDED') {
      throw new BadRequestException('Order has already been paid');
    }

    // Create test payment intent that auto-succeeds
    const testPayment = await this.stripeService.createTestPaymentIntent(
      Number(order.price),
      order.currency,
      orderId,
    );

    // Update order
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: testPayment.paymentIntentId,
        paymentStatus: 'SUCCEEDED',
        paidAt: new Date(),
        status: 'CONFIRMED',
      },
    });

    this.logger.log(`Test payment succeeded for order ${orderId}`);
    return {
      success: true,
      message: 'Test payment successful',
      paymentIntentId: testPayment.paymentIntentId,
      orderId: order.id,
    };
  }
}
