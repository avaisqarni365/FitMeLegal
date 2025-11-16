import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RespondToReviewDto } from './dto/respond-to-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new review
   */
  async create(reviewerId: string, createReviewDto: CreateReviewDto) {
    const { advisorId, orderId, serviceId, questionId, rating, comment } =
      createReviewDto;

    // Verify advisor exists
    const advisor = await this.prisma.advisor.findUnique({
      where: { id: advisorId },
      include: { user: true },
    });

    if (!advisor) {
      throw new NotFoundException('Advisor not found');
    }

    // Prevent self-review
    if (advisor.userId === reviewerId) {
      throw new BadRequestException('You cannot review yourself');
    }

    // Check if reviewing an order
    let verified = false;
    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { service: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.clientId !== reviewerId) {
        throw new ForbiddenException('You can only review your own orders');
      }

      if (order.status !== 'COMPLETED') {
        throw new BadRequestException('You can only review completed orders');
      }

      // Check if already reviewed
      const existingReview = await this.prisma.review.findFirst({
        where: { reviewerId, orderId },
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this order');
      }

      verified = true;
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        reviewerId,
        advisorId,
        orderId,
        serviceId: serviceId || null,
        questionId: questionId || null,
        rating,
        comment,
        verified,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        advisor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Update advisor rating
    await this.updateAdvisorRating(advisorId);

    // Update service rating if applicable
    if (serviceId) {
      await this.updateServiceRating(serviceId);
    }

    return review;
  }

  /**
   * Get all reviews for an advisor
   */
  async getAdvisorReviews(advisorId: string, filterDto: ReviewFilterDto) {
    const { minRating, verifiedOnly, page, limit } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = { advisorId };

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (verifiedOnly) {
      where.verified = true;
    }

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.getAdvisorRatingStats(advisorId),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Get rating statistics for an advisor
   */
  async getAdvisorRatingStats(advisorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { advisorId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const distribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    );

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      distribution,
    };
  }

  /**
   * Get a single review
   */
  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        advisor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  /**
   * Update a review (reviewer only)
   */
  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update advisor rating if rating changed
    if (updateReviewDto.rating) {
      await this.updateAdvisorRating(review.advisorId);
      if (review.serviceId) {
        await this.updateServiceRating(review.serviceId);
      }
    }

    return updated;
  }

  /**
   * Respond to a review (advisor only)
   */
  async respondToReview(
    id: string,
    advisorUserId: string,
    respondToReviewDto: RespondToReviewDto,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { advisor: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.advisor.userId !== advisorUserId) {
      throw new ForbiddenException('You can only respond to your own reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: { response: respondToReviewDto.response },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Delete a review
   */
  async remove(id: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only reviewer or admin can delete
    if (review.reviewerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only delete your own reviews or be an admin',
      );
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update advisor rating
    await this.updateAdvisorRating(review.advisorId);
    if (review.serviceId) {
      await this.updateServiceRating(review.serviceId);
    }

    return { success: true, message: 'Review deleted' };
  }

  /**
   * Update advisor's overall rating
   */
  private async updateAdvisorRating(advisorId: string) {
    const stats = await this.getAdvisorRatingStats(advisorId);

    await this.prisma.advisor.update({
      where: { id: advisorId },
      data: {
        rating: stats.averageRating,
        totalReviews: stats.totalReviews,
      },
    });
  }

  /**
   * Update service's average rating
   */
  private async updateServiceRating(serviceId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { serviceId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await this.prisma.service.update({
        where: { id: serviceId },
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
    });
  }

  /**
   * Get reviews by reviewer (my reviews)
   */
  async getMyReviews(reviewerId: string, filterDto: ReviewFilterDto) {
    const { page, limit } = filterDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { reviewerId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          advisor: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where: { reviewerId } }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
