import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const mode = this.configService.get<string>('STRIPE_MODE') || 'test';

    if (!secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured. Using dummy test mode.',
      );
      // Initialize with a dummy key pattern for development
      this.stripe = new Stripe('sk_test_dummy', {
        apiVersion: '2024-11-20.acacia',
      });
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2024-11-20.acacia',
      });
      this.logger.log(`Stripe initialized in ${mode} mode`);
    }

    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  onModuleInit() {
    this.logger.log('Stripe service initialized');
  }

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: {
      orderId: string;
      clientId: string;
      serviceId: string;
      advisorId: string;
    },
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw error;
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
      );
      this.logger.log(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to confirm payment intent:', error);
      throw error;
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId,
      );
      this.logger.log(`Payment intent cancelled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to cancel payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error('Failed to create refund:', error);
      throw error;
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured, skipping verification');
      return JSON.parse(payload.toString());
    }

    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }

  /**
   * Create a test payment intent (for development/testing)
   */
  async createTestPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    status: string;
  }> {
    // In test mode, create a payment intent that auto-succeeds
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        testMode: 'true',
      },
      confirm: true, // Auto-confirm for testing
      payment_method_data: {
        type: 'card',
        card: {
          token: 'tok_visa', // Stripe test token
        },
      },
      automatic_payment_methods: {
        enabled: false, // Disable when using payment_method_data
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || '',
      status: paymentIntent.status,
    };
  }
}
