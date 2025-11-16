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
   * Create or get a Stripe customer
   */
  async createOrGetCustomer(
    email: string,
    userId: string,
    name?: string,
  ): Promise<Stripe.Customer> {
    try {
      // Try to find existing customer
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        this.logger.log(`Existing customer found: ${customers.data[0].id}`);
        return customers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });

      this.logger.log(`New customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Failed to create/get customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      const { customerId, priceId, paymentMethodId, trialPeriodDays, metadata } = params;

      // Attach payment method if provided
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        metadata,
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to create subscription:', error);
      throw error;
    }
  }

  /**
   * Update a subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      const updatedSubscription = await this.stripe.subscriptions.update(
        subscriptionId,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'always_invoice',
        },
      );

      this.logger.log(`Subscription updated: ${subscriptionId}`);
      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    try {
      if (cancelAtPeriodEnd) {
        const subscription = await this.stripe.subscriptions.update(
          subscriptionId,
          {
            cancel_at_period_end: true,
          },
        );
        this.logger.log(`Subscription will cancel at period end: ${subscriptionId}`);
        return subscription;
      } else {
        const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
        this.logger.log(`Subscription cancelled immediately: ${subscriptionId}`);
        return subscription;
      }
    } catch (error) {
      this.logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Create a price for a product
   */
  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    recurring: {
      interval: 'month' | 'year';
    };
  }): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.create({
        product: params.productId,
        unit_amount: Math.round(params.unitAmount * 100),
        currency: params.currency.toLowerCase(),
        recurring: params.recurring,
      });

      this.logger.log(`Price created: ${price.id}`);
      return price;
    } catch (error) {
      this.logger.error('Failed to create price:', error);
      throw error;
    }
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
