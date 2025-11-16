import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  /**
   * Get all subscription plans
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a specific plan by slug
   */
  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  /**
   * Subscribe a user to a plan
   */
  async subscribe(userId: string, subscribeDto: SubscribeDto) {
    const { planSlug, billingPeriod, paymentMethodId, startTrial } = subscribeDto;

    // Check if user already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'You already have an active subscription. Please upgrade/downgrade or cancel first.',
      );
    }

    // Get subscription plan
    const plan = await this.getPlanBySlug(planSlug);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create or get Stripe customer
    const customer = await this.stripeService.createOrGetCustomer(
      user.email,
      userId,
      `${user.firstName} ${user.lastName}`,
    );

    // Determine price based on billing period
    const price = billingPeriod === 'ANNUAL' && plan.annualPrice
      ? plan.annualPrice
      : plan.price;

    // For now, we'll store the price directly since we don't have Stripe prices set up
    // In production, you'd create Stripe prices and use stripePriceId
    const stripePriceId = `price_${planSlug}_${billingPeriod.toLowerCase()}`;

    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();

    if (startTrial) {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 14); // 14 day trial
    } else if (billingPeriod === 'ANNUAL') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Create subscription in our database
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: startTrial ? 'TRIALING' : 'ACTIVE',
        billingPeriod,
        stripeCustomerId: customer.id,
        stripePriceId,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart: startTrial ? new Date() : null,
        trialEnd: startTrial ? currentPeriodEnd : null,
      },
      include: {
        plan: true,
      },
    });

    // Initialize usage tracking for current period
    await this.initializeUsageTracking(subscription.id, userId);

    return subscription;
  }

  /**
   * Get user's current subscription
   */
  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      return null;
    }

    // Get current usage
    const usage = await this.getCurrentUsage(subscription.id, userId);

    return {
      ...subscription,
      usage,
    };
  }

  /**
   * Upgrade or downgrade subscription
   */
  async updateSubscription(
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const { newPlanSlug, billingPeriod } = updateSubscriptionDto;

    // Get current subscription
    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: {
        plan: true,
      },
    });

    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    // Get new plan
    const newPlan = await this.getPlanBySlug(newPlanSlug);

    // Update subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId: newPlan.id,
        billingPeriod: billingPeriod || currentSubscription.billingPeriod,
      },
      include: {
        plan: true,
      },
    });

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    userId: string,
    cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    const { cancelAtPeriodEnd, reason } = cancelSubscriptionDto;

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (cancelAtPeriodEnd) {
      // Mark to cancel at period end
      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
        include: {
          plan: true,
        },
      });

      return {
        ...updatedSubscription,
        message: 'Subscription will be cancelled at the end of the billing period',
      };
    } else {
      // Cancel immediately
      const cancelledSubscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          plan: true,
        },
      });

      return {
        ...cancelledSubscription,
        message: 'Subscription cancelled immediately',
      };
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        cancelAtPeriodEnd: true,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        'No subscription scheduled for cancellation found',
      );
    }

    const reactivated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
      },
      include: {
        plan: true,
      },
    });

    return {
      ...reactivated,
      message: 'Subscription reactivated successfully',
    };
  }

  /**
   * Get current usage for a subscription
   */
  async getCurrentUsage(subscriptionId: string, userId: string) {
    const currentPeriod = this.getCurrentPeriod();

    const usage = await this.prisma.usageTracking.findUnique({
      where: {
        subscriptionId_period: {
          subscriptionId,
          period: currentPeriod,
        },
      },
    });

    return usage || {
      questionsUsed: 0,
      videoMinutesUsed: 0,
      documentReviewsUsed: 0,
    };
  }

  /**
   * Track question usage
   */
  async trackQuestionUsage(userId: string) {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      return; // No subscription, no tracking needed
    }

    await this.incrementUsage(subscription.id, userId, 'questionsUsed', 1);

    // Check if limit exceeded
    const plan = subscription.plan;
    if (plan.questionsPerMonth !== -1) {
      const usage = await this.getCurrentUsage(subscription.id, userId);
      if (usage.questionsUsed > plan.questionsPerMonth) {
        throw new ForbiddenException(
          'You have exceeded your monthly question limit. Please upgrade your plan.',
        );
      }
    }
  }

  /**
   * Track video minutes usage
   */
  async trackVideoMinutesUsage(userId: string, minutes: number) {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      return;
    }

    await this.incrementUsage(subscription.id, userId, 'videoMinutesUsed', minutes);

    const plan = subscription.plan;
    if (plan.videoMinutesPerMonth !== -1) {
      const usage = await this.getCurrentUsage(subscription.id, userId);
      if (usage.videoMinutesUsed > plan.videoMinutesPerMonth) {
        throw new ForbiddenException(
          'You have exceeded your monthly video minutes limit. Please upgrade your plan.',
        );
      }
    }
  }

  /**
   * Track document review usage
   */
  async trackDocumentReviewUsage(userId: string) {
    const subscription = await this.getActiveSubscription(userId);
    if (!subscription) {
      return;
    }

    await this.incrementUsage(subscription.id, userId, 'documentReviewsUsed', 1);

    const plan = subscription.plan;
    if (plan.documentReviewsPerMonth !== -1) {
      const usage = await this.getCurrentUsage(subscription.id, userId);
      if (usage.documentReviewsUsed > plan.documentReviewsPerMonth) {
        throw new ForbiddenException(
          'You have exceeded your monthly document review limit. Please upgrade your plan.',
        );
      }
    }
  }

  /**
   * Get usage statistics with limits
   */
  async getUsageStats(userId: string) {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return {
        hasSubscription: false,
        plan: null,
        usage: null,
        limits: null,
      };
    }

    const usage = await this.getCurrentUsage(subscription.id, userId);
    const plan = subscription.plan;

    return {
      hasSubscription: true,
      plan: {
        name: plan.name,
        slug: plan.slug,
      },
      usage: {
        questionsUsed: usage.questionsUsed,
        videoMinutesUsed: usage.videoMinutesUsed,
        documentReviewsUsed: usage.documentReviewsUsed,
      },
      limits: {
        questionsPerMonth: plan.questionsPerMonth,
        videoMinutesPerMonth: plan.videoMinutesPerMonth,
        documentReviewsPerMonth: plan.documentReviewsPerMonth,
      },
      percentage: {
        questions: plan.questionsPerMonth === -1 ? 0 : (usage.questionsUsed / plan.questionsPerMonth) * 100,
        videoMinutes: plan.videoMinutesPerMonth === -1 ? 0 : (usage.videoMinutesUsed / plan.videoMinutesPerMonth) * 100,
        documentReviews: plan.documentReviewsPerMonth === -1 ? 0 : (usage.documentReviewsUsed / plan.documentReviewsPerMonth) * 100,
      },
    };
  }

  // Private helper methods

  private async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: {
        plan: true,
      },
    });
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async initializeUsageTracking(subscriptionId: string, userId: string) {
    const period = this.getCurrentPeriod();

    await this.prisma.usageTracking.upsert({
      where: {
        subscriptionId_period: {
          subscriptionId,
          period,
        },
      },
      create: {
        subscriptionId,
        userId,
        period,
        questionsUsed: 0,
        videoMinutesUsed: 0,
        documentReviewsUsed: 0,
      },
      update: {},
    });
  }

  private async incrementUsage(
    subscriptionId: string,
    userId: string,
    field: 'questionsUsed' | 'videoMinutesUsed' | 'documentReviewsUsed',
    amount: number,
  ) {
    const period = this.getCurrentPeriod();

    await this.prisma.usageTracking.upsert({
      where: {
        subscriptionId_period: {
          subscriptionId,
          period,
        },
      },
      create: {
        subscriptionId,
        userId,
        period,
        [field]: amount,
      },
      update: {
        [field]: {
          increment: amount,
        },
      },
    });
  }
}
