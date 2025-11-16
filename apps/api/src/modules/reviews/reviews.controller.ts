import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RespondToReviewDto } from './dto/respond-to-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@fitmelegal/shared';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review (Client only)' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot review yourself or invalid order/service',
  })
  @ApiResponse({ status: 404, description: 'Advisor or order not found' })
  async create(
    @CurrentUser() user: any,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @Get('advisor/:advisorId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for an advisor (Public)' })
  @ApiResponse({ status: 200, description: 'List of reviews with statistics' })
  async getAdvisorReviews(
    @Param('advisorId') advisorId: string,
    @Query() filterDto: ReviewFilterDto,
  ) {
    return this.reviewsService.getAdvisorReviews(advisorId, filterDto);
  }

  @Get('advisor/:advisorId/stats')
  @Public()
  @ApiOperation({ summary: 'Get rating statistics for an advisor (Public)' })
  @ApiResponse({ status: 200, description: 'Rating statistics' })
  async getAdvisorStats(@Param('advisorId') advisorId: string) {
    return this.reviewsService.getAdvisorRatingStats(advisorId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my reviews' })
  @ApiResponse({ status: 200, description: 'List of reviews I created' })
  async getMyReviews(
    @CurrentUser() user: any,
    @Query() filterDto: ReviewFilterDto,
  ) {
    return this.reviewsService.getMyReviews(user.id, filterDto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single review by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Review found' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review (Owner only)' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, user.id, updateReviewDto);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADVISOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Respond to a review (Advisor only)' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the advisor being reviewed',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async respondToReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() respondToReviewDto: RespondToReviewDto,
  ) {
    return this.reviewsService.respondToReview(id, user.id, respondToReviewDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (Owner or Admin)' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner or admin' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reviewsService.remove(id, user.id, user.role);
  }
}
