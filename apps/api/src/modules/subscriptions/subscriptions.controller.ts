import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: 'Get all subscription plans',
    description: 'Get list of available subscription plans with pricing and features',
  })
  @ApiResponse({ status: 200, description: 'List of subscription plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:slug')
  @ApiOperation({
    summary: 'Get subscription plan by slug',
    description: 'Get details of a specific subscription plan',
  })
  @ApiResponse({ status: 200, description: 'Subscription plan details' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlanBySlug(slug);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Subscribe to a plan',
    description: 'Create a new subscription for the current user',
  })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Already has an active subscription' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async subscribe(
    @CurrentUser() user: any,
    @Body() subscribeDto: SubscribeDto,
  ) {
    return this.subscriptionsService.subscribe(user.id, subscribeDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my subscription',
    description: 'Get current user subscription with usage stats',
  })
  @ApiResponse({ status: 200, description: 'Current subscription' })
  async getMySubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Patch('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upgrade or downgrade subscription',
    description: 'Change subscription plan',
  })
  @ApiResponse({ status: 200, description: 'Subscription updated' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async updateSubscription(
    @CurrentUser() user: any,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.updateSubscription(
      user.id,
      updateSubscriptionDto,
    );
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancel current subscription (immediately or at period end)',
  })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async cancelSubscription(
    @CurrentUser() user: any,
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancelSubscription(
      user.id,
      cancelSubscriptionDto,
    );
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reactivate subscription',
    description: 'Reactivate a subscription that was scheduled for cancellation',
  })
  @ApiResponse({ status: 200, description: 'Subscription reactivated' })
  @ApiResponse({ status: 404, description: 'No subscription to reactivate' })
  async reactivateSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.reactivateSubscription(user.id);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get usage statistics',
    description: 'Get current usage stats with limits and percentages',
  })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsageStats(@CurrentUser() user: any) {
    return this.subscriptionsService.getUsageStats(user.id);
  }
}
