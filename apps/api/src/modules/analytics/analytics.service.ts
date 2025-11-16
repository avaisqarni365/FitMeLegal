import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verify user has analytics access (admin or the user themselves)
   */
  private async verifyAccess(userId: string, targetUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Admin can see all analytics
    if (user.role === 'ADMIN') {
      return true;
    }

    // User can only see their own analytics
    if (targetUserId && targetUserId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }

  /**
   * Get platform-wide analytics (admin only)
   */
  async getPlatformAnalytics(userId: string, period?: '7d' | '30d' | '90d' | '1y') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user growth
    const [newUsers, totalUsers] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.user.count(),
    ]);

    // Get order statistics
    const [newOrders, completedOrders, orderRevenue] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.order.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate },
        },
        _sum: { price: true },
      }),
    ]);

    // Get question activity
    const [newQuestions, answeredQuestions] = await Promise.all([
      this.prisma.question.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.question.count({
        where: {
          status: 'ANSWERED',
          updatedAt: { gte: startDate },
        },
      }),
    ]);

    // Get subscription statistics
    const [activeSubscriptions, newSubscriptions] = await Promise.all([
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Get advisor statistics
    const [totalAdvisors, newAdvisors, verifiedAdvisors] = await Promise.all([
      this.prisma.advisor.count(),
      this.prisma.advisor.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.advisor.count({
        where: { verificationStatus: 'VERIFIED' },
      }),
    ]);

    // Get service statistics
    const [totalServices, activeServices] = await Promise.all([
      this.prisma.service.count(),
      this.prisma.service.count({
        where: { active: true },
      }),
    ]);

    return {
      period: period || '30d',
      dateRange: {
        from: startDate.toISOString(),
        to: now.toISOString(),
      },
      users: {
        total: totalUsers,
        new: newUsers,
        growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
      },
      orders: {
        total: newOrders,
        completed: completedOrders,
        revenue: orderRevenue._sum.price || 0,
        averageOrderValue: completedOrders > 0
          ? ((orderRevenue._sum.price as any || 0) / completedOrders).toFixed(2)
          : 0,
      },
      questions: {
        total: newQuestions,
        answered: answeredQuestions,
        answerRate: newQuestions > 0
          ? ((answeredQuestions / newQuestions) * 100).toFixed(2) + '%'
          : '0%',
      },
      subscriptions: {
        active: activeSubscriptions,
        new: newSubscriptions,
      },
      advisors: {
        total: totalAdvisors,
        new: newAdvisors,
        verified: verifiedAdvisors,
        verificationRate: totalAdvisors > 0
          ? ((verifiedAdvisors / totalAdvisors) * 100).toFixed(2) + '%'
          : '0%',
      },
      services: {
        total: totalServices,
        active: activeServices,
      },
    };
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(userId: string, targetUserId?: string) {
    const userIdToAnalyze = targetUserId || userId;
    await this.verifyAccess(userId, userIdToAnalyze);

    const user = await this.prisma.user.findUnique({
      where: { id: userIdToAnalyze },
      include: { advisor: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's orders
    const [totalOrders, completedOrders, orderSpending] = await Promise.all([
      this.prisma.order.count({
        where: { clientId: userIdToAnalyze },
      }),
      this.prisma.order.count({
        where: {
          clientId: userIdToAnalyze,
          status: 'COMPLETED',
        },
      }),
      this.prisma.order.aggregate({
        where: {
          clientId: userIdToAnalyze,
          status: 'COMPLETED',
        },
        _sum: { price: true },
      }),
    ]);

    // Get user's questions
    const [totalQuestions, answeredQuestions] = await Promise.all([
      this.prisma.question.count({
        where: { userId: userIdToAnalyze },
      }),
      this.prisma.question.count({
        where: {
          userId: userIdToAnalyze,
          status: 'ANSWERED',
        },
      }),
    ]);

    const analytics: any = {
      userId: userIdToAnalyze,
      role: user.role,
      memberSince: user.createdAt,
      orders: {
        total: totalOrders,
        completed: completedOrders,
        spending: orderSpending._sum.price || 0,
      },
      questions: {
        total: totalQuestions,
        answered: answeredQuestions,
      },
    };

    // If user is an advisor, add advisor-specific analytics
    if (user.advisor) {
      const [
        totalAnswers,
        totalServices,
        advisorOrders,
        advisorRevenue,
        avgRating,
      ] = await Promise.all([
        this.prisma.answer.count({
          where: { advisorId: user.advisor.id },
        }),
        this.prisma.service.count({
          where: { advisorId: user.advisor.id },
        }),
        this.prisma.order.count({
          where: { service: { advisorId: user.advisor.id } },
        }),
        this.prisma.order.aggregate({
          where: {
            service: { advisorId: user.advisor.id },
            status: 'COMPLETED',
          },
          _sum: { price: true },
        }),
        this.prisma.review.aggregate({
          where: { advisorId: user.advisor.id },
          _avg: { rating: true },
        }),
      ]);

      analytics.advisor = {
        verificationStatus: user.advisor.verificationStatus,
        verificationLevel: user.advisor.verificationLevel,
        rating: user.advisor.rating,
        totalReviews: user.advisor.totalReviews,
        answers: {
          total: totalAnswers,
        },
        services: {
          total: totalServices,
          active: await this.prisma.service.count({
            where: { advisorId: user.advisor.id, active: true },
          }),
        },
        orders: {
          total: advisorOrders,
          revenue: advisorRevenue._sum.price || 0,
        },
        performance: {
          responseTime: user.advisor.responseTimeMinutes,
          acceptanceRate: user.advisor.acceptanceRate,
          averageRating: avgRating._avg.rating || 0,
        },
      };
    }

    return analytics;
  }

  /**
   * Get advisor leaderboard (top performing advisors)
   */
  async getAdvisorLeaderboard(userId: string, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const advisors = await this.prisma.advisor.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        active: true,
      },
      take: limit,
      orderBy: [
        { rating: 'desc' },
        { totalReviews: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return advisors.map((advisor, index) => ({
      rank: index + 1,
      advisorId: advisor.id,
      name: `${advisor.user.firstName} ${advisor.user.lastName}`,
      rating: advisor.rating,
      totalReviews: advisor.totalReviews,
      totalEarnings: advisor.totalEarnings,
      responseTime: advisor.responseTimeMinutes,
      acceptanceRate: advisor.acceptanceRate,
    }));
  }

  /**
   * Get popular services
   */
  async getPopularServices(userId: string, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const services = await this.prisma.service.findMany({
      where: { active: true },
      take: limit,
      orderBy: [
        { totalOrders: 'desc' },
        { averageRating: 'desc' },
      ],
      include: {
        advisor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return services.map((service, index) => ({
      rank: index + 1,
      serviceId: service.id,
      title: service.title,
      category: service.category,
      price: service.price,
      totalOrders: service.totalOrders,
      averageRating: service.averageRating,
      totalRevenue: service.totalRevenue,
      advisor: {
        name: `${service.advisor.user.firstName} ${service.advisor.user.lastName}`,
      },
    }));
  }

  /**
   * Get revenue analytics by period
   */
  async getRevenueAnalytics(userId: string, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get orders revenue
    const ordersRevenue = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate },
      },
      _sum: { price: true },
      _count: true,
    });

    // Get revenue by category
    const legalOrders = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate },
        service: { category: 'LEGAL' },
      },
      _sum: { price: true },
    });

    const taxOrders = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate },
        service: { category: 'TAX' },
      },
      _sum: { price: true },
    });

    return {
      period,
      dateRange: {
        from: startDate.toISOString(),
        to: now.toISOString(),
      },
      totalRevenue: ordersRevenue._sum.price || 0,
      totalOrders: ordersRevenue._count,
      averageOrderValue: ordersRevenue._count > 0
        ? ((ordersRevenue._sum.price as any || 0) / ordersRevenue._count).toFixed(2)
        : 0,
      byCategory: {
        legal: legalOrders._sum.price || 0,
        tax: taxOrders._sum.price || 0,
      },
    };
  }
}
