import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get platform-wide analytics (admin only)' })
  getPlatformAnalytics(
    @Request() req,
    @Query('period') period?: '7d' | '30d' | '90d' | '1y',
  ) {
    return this.analyticsService.getPlatformAnalytics(req.user.userId, period);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get my analytics' })
  getMyAnalytics(@Request() req) {
    return this.analyticsService.getUserAnalytics(req.user.userId);
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user analytics by ID (admin only)' })
  getUserAnalytics(@Request() req, @Param('id') id: string) {
    return this.analyticsService.getUserAnalytics(req.user.userId, id);
  }

  @Get('leaderboard/advisors')
  @ApiOperation({ summary: 'Get advisor leaderboard (admin only)' })
  getAdvisorLeaderboard(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getAdvisorLeaderboard(
      req.user.userId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('popular/services')
  @ApiOperation({ summary: 'Get popular services (admin only)' })
  getPopularServices(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getPopularServices(
      req.user.userId,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics (admin only)' })
  getRevenueAnalytics(
    @Request() req,
    @Query('period') period?: '7d' | '30d' | '90d' | '1y',
  ) {
    return this.analyticsService.getRevenueAnalytics(req.user.userId, period);
  }
}
